using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Sockets;
using System.Threading;
using System.Net;
using Newtonsoft.Json;
using CyUSB;
using System.Data.SQLite;
using System.Data;

namespace AcquisitionSocketServer
{
    class Program
    {
        //创建套接字  
        static Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        private static byte[] result = new byte[1024];

        static CyControlEndPoint CtrlEndPt = null;
        static CyUSBDevice MyDevice = null;
        static Thread checkProgressThr;

        static ushort trigTh = 680, chATh = 680, chBTh = 680, chCTh = 680;
        static byte[] acquisitionStartCmd = new byte[17];
        static byte[] chA, chB;
        static uint accumTimes;
        static ushort binNum = 2000;
        static float resolution = 15;
        static string taskId;
        private static Object acLock = new Object();

        static string path = @"C:\Server\LidarServer\app.db";

        static void Main(string[] args)
        {
            SocketServie();
        }
        public static void SocketServie()
        {
            Console.WriteLine("采集服务已启动");
            string host = "0.0.0.0";//IP地址
            int port = 6016;//端口
            socket.Bind(new IPEndPoint(IPAddress.Parse(host), port));
            socket.Listen(100);//设定最多100个排队连接请求   
            USBDeviceList usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);//连接采集卡
            MyDevice = usbDevices[0] as CyUSBDevice;
            if (MyDevice != null)
                CtrlEndPt = MyDevice.ControlEndPt;
            else
            {
                Console.WriteLine("采集卡未连接");
            }
            Thread myThread = new Thread(ListenClientConnect);//通过多线程监听客户端连接  
            myThread.Start();
            Console.ReadLine();
        }

        /// <summary>  
        /// 监听客户端连接  
        /// </summary>  
        private static void ListenClientConnect()
        {
            while (true)
            {
                Socket clientSocket = socket.Accept();
                //clientSocket.Send(Encoding.UTF8.GetBytes("服务器连接成功"));
                Thread receiveThread = new Thread(ReceiveMessage);
                receiveThread.Start(clientSocket);
            }
        }

        /// <summary>  
        /// 接收消息  
        /// </summary>  
        /// <param name="clientSocket"></param>  
        private static void ReceiveMessage(object clientSocket)
        {
            Socket myClientSocket = (Socket)clientSocket;
            while (true)
            {
                try
                {
                    //通过clientSocket接收数据  
                    int receiveNumber = myClientSocket.Receive(result);
                    if (receiveNumber == 0)
                        return;
                    //Console.WriteLine("接收客户端{0} 的消息：{1}", myClientSocket.RemoteEndPoint.ToString(), Encoding.UTF8.GetString(result, 0, receiveNumber));
                    dynamic cmd = JsonConvert.DeserializeObject(Encoding.UTF8.GetString(result, 0, receiveNumber));
                    int resultCode = 0;
                    switch ((string)cmd.cmdType)
                    {
                        case "acqStart":
                            taskId = cmd.cmdParams.taskId;
                            accumTimes = cmd.cmdParams.accumTimes;
                            binNum = cmd.cmdParams.binNum;
                            resolution = cmd.cmdParams.resolution;
                            ConstructAcquisitionStartCmd();
                            chA = new byte[binNum * 4];
                            chB = new byte[binNum * 4];
                            StartAcquisition();
                            resultCode = 1;
                            break;

                        case "acqStop":
                            StopAcquisition();
                            resultCode = 1;
                            break;

                        case "acqProgress":
                            resultCode = CheckAcquisitionTimes();
                            break;

                        case "acqRunning":
                            resultCode = CheckAcquisitionRunning();
                            break;
                    }
                    
                    //给Client端返回信息
                    string sendStr = "{\"cmdType\":\"" + cmd.cmdType + "\",\"result\":" + resultCode + "}";
                    byte[] bs = Encoding.UTF8.GetBytes(sendStr);//Encoding.UTF8.GetBytes()不然中文会乱码
                    myClientSocket.Send(bs, bs.Length, 0);  //返回信息给客户端
                    myClientSocket.Close(); //发送完数据关闭Socket并释放资源
                    Console.ReadLine();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    myClientSocket.Shutdown(SocketShutdown.Both);//禁止发送和上传
                    myClientSocket.Close();//关闭Socket并释放资源
                    break;
                }
            }
        }

        private static void CheckAcquistionProgress()
        {
            checkProgressThr = new Thread(() => CheckProgressLoop());
            checkProgressThr.Start();
        }

        private static void CheckProgressLoop()
        {
            int currentAccumNum = 0;
            while (true)
            {
                //if (CtrlEndPt != null)
                //{
                //    CtrlEndPt.Target = CyConst.TGT_DEVICE;

                //    CtrlEndPt.ReqType = 0x40;

                //    CtrlEndPt.ReqCode = 0xb8;

                //    CtrlEndPt.Value = 0x00ba;

                //    CtrlEndPt.Index = 0x0000;

                //    int len = 2;

                //    byte[] buf = new byte[] { 0xC1, 0x01 };

                //    CtrlEndPt.Write(ref buf, ref len);
                //}

                //if (MyDevice.BulkInEndPt != null)
                //{
                //    int len = 512;

                //    byte[] buf = new byte[len];

                //    MyDevice.BulkInEndPt.XferData(ref buf, ref len);

                //    currentAccumNum = BitConverter.ToUInt32(buf, 1);

                //    if (currentAccumNum >= accumTimes) break;
                //}
                currentAccumNum = CheckAcquisitionTimes();
                if (currentAccumNum >= accumTimes) break;
                Thread.Sleep(20);
            }
            CheckAcquisitionChannelData(binNum, chA, chB);
            Console.WriteLine(DateTime.Now + "   " + currentAccumNum);
            Thread receiveThread = new Thread(UpdateAcquisitionDB);
            receiveThread.Start();
            StartAcquisition();
        }

        private static void UpdateAcquisitionDB()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                string s = taskId;
                int n = 100;
                cmd.CommandText = "SELECT * FROM task WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                SQLiteDataReader sr = cmd.ExecuteReader();
                while (sr.Read())
                {
                    n = sr.GetInt32(9);
                }
                sr.Close();
                
                cmd.CommandText = "UPDATE task SET data_num=@score,end_time=@time WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("score", DbType.Int32).Value = n+1;
                var dt = DateTime.Now.ToString("s");
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.ExecuteNonQuery();

                cmd.CommandText = "INSERT INTO task_data(task_id,timestamp,raw_A,raw_B) VALUES(@id,@time,@a,@b)";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.Parameters.Add("a", DbType.Binary).Value = chA;
                cmd.Parameters.Add("b", DbType.Binary).Value = chB;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

        private static int CheckAcquisitionChannelData(int readLength, byte[] ChA, byte[] ChB)
        {
            if (MyDevice != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;

                byte readLen = 8;
                var readTimes = (int)readLen * 2;
                var readbytes = new byte[readLen * 1024];

                int len = 3;
                byte[] bufA = new byte[] { 0xC2, 0xca, readLen };
                CtrlEndPt.Write(ref bufA, ref len);

                len = 512;
                bufA = new byte[len];
                for (int i = 0; i < readTimes; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufA, ref len);
                    Array.Copy(bufA, 0, readbytes, 512 * i, 512);
                }
                Array.Copy(readbytes, 0, ChA, 0, ChA.Length);

                len = 3;
                byte[] bufB = new byte[] { 0xC2, 0xcb, readLen };
                CtrlEndPt.Write(ref bufB, ref len);

                len = 512;
                bufB = new byte[len];
                for (int i = 0; i < readTimes; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufB, ref len);
                    Array.Copy(bufB, 0, readbytes, 512 * i, 512);
                }
                Array.Copy(readbytes, 0, ChB, 0, ChB.Length);

                return 0;
            }
            else
                return -1;
        }

        private static void StartAcquisition()
        {
            if (CtrlEndPt != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;

                CtrlEndPt.ReqType = 0x40;

                CtrlEndPt.ReqCode = 0xb8;

                CtrlEndPt.Value = 0x00ba;

                CtrlEndPt.Index = 0x0000;

                int len = acquisitionStartCmd.Length;

                CtrlEndPt.Write(ref acquisitionStartCmd, ref len);
            }

            //查询采集进度
            CheckAcquistionProgress();
        }

        private static void StopAcquisition()
        {
            if (CtrlEndPt != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;

                CtrlEndPt.ReqType = 0x40;

                CtrlEndPt.ReqCode = 0xb8;

                CtrlEndPt.Value = 0x00ba;

                CtrlEndPt.Index = 0x0000;

                int len = 2;

                byte[] buf = new byte[] { 0xC4, 0xa0 };

                CtrlEndPt.Write(ref buf, ref len);
            }

            checkProgressThr.Abort();
        }

        private static void ConstructAcquisitionStartCmd()
        {
            byte[] accumTimesBytes = BitConverter.GetBytes(accumTimes);
            byte[] binNumBytes = BitConverter.GetBytes(binNum);

            acquisitionStartCmd[0] = 0xC0;
            Array.Copy(accumTimesBytes, 0, acquisitionStartCmd, 1, 4);
            Array.Copy(binNumBytes, 0, acquisitionStartCmd, 5, 2);

            byte resolutionByte = 0xcc;
            if (resolution == 5)
                resolutionByte = 0xaa;
            else if (resolution == 7.5f)
                resolutionByte = 0xbb;
            else if (resolution == 15)
                resolutionByte = 0xcc;
            else if (resolution == 30)
                resolutionByte = 0xdd;
            acquisitionStartCmd[7] = resolutionByte;

            byte[] trigThBytes = BitConverter.GetBytes(trigTh);
            byte[] chAThBytes = BitConverter.GetBytes(chATh);
            byte[] chBThBytes = BitConverter.GetBytes(chBTh);
            byte[] chCThBytes = BitConverter.GetBytes(chCTh);
            Array.Copy(trigThBytes, 0, acquisitionStartCmd, 8, 2);
            Array.Copy(chAThBytes, 0, acquisitionStartCmd, 10, 2);
            Array.Copy(chBThBytes, 0, acquisitionStartCmd, 12, 2);
            Array.Copy(chCThBytes, 0, acquisitionStartCmd, 14, 2);
            acquisitionStartCmd[16] = 0xff;
        }

        private static int CheckAcquisitionTimes()
        {
            lock (acLock)
            {
                if (MyDevice != null)
                {
                    CtrlEndPt.Target = CyConst.TGT_DEVICE;
                    CtrlEndPt.ReqType = 0x40;
                    CtrlEndPt.ReqCode = 0xb8;
                    CtrlEndPt.Value = 0x00ba;
                    CtrlEndPt.Index = 0x0000;

                    int len = 2;
                    byte[] buf = new byte[] { 0xC1, 0x01 };
                    CtrlEndPt.Write(ref buf, ref len);

                    len = 512;
                    buf = new byte[len];
                    MyDevice.BulkInEndPt.XferData(ref buf, ref len);

                    uint currentAccumNum = BitConverter.ToUInt32(buf, 1);

                    return (int)currentAccumNum;
                }
                else
                    return -1;
            }
        }

        private static int CheckAcquisitionRunning()
        {
            if (MyDevice != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;

                int currentR = 0;
                for (int i = 0; i < 10; i++)
                {
                    int len = 2;
                    byte[] buf = new byte[] { 0xC1, 0x01 };
                    CtrlEndPt.Write(ref buf, ref len);

                    len = 512;
                    buf = new byte[len];
                    MyDevice.BulkInEndPt.XferData(ref buf, ref len);
                    currentR = buf[0];
                    System.Threading.Thread.Sleep(1);
                }

                return currentR;
            }
            else
                return -1;
        }
    }
}
