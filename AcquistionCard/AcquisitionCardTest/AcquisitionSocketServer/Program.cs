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
using System.Runtime.InteropServices;

namespace AcquisitionSocketServer
{
    class Program
    {
        //创建套接字  
        static Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        private static byte[] result = new byte[1024];

        static USBDeviceList usbDevices = null;
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
        static Object acLock = new Object();
        static int currentAccumNum = 0;
        static int running = 0;

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

            usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);//连接采集卡
            MyDevice = usbDevices[0] as CyUSBDevice;
            if (MyDevice != null)
            {
                CtrlEndPt = MyDevice.ControlEndPt;
                if (CtrlEndPt != null)
                {
                    CtrlEndPt.Target = CyConst.TGT_DEVICE;
                    CtrlEndPt.ReqType = 0x40;
                    CtrlEndPt.ReqCode = 0xb8;
                    CtrlEndPt.Value = 0x00ba;
                    CtrlEndPt.Index = 0x0000;
                }
            }
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
                            taskId = (string)cmd.cmdParams.taskId;
                            accumTimes = (uint)cmd.cmdParams.accumTimes;
                            binNum = (ushort)cmd.cmdParams.binNum;
                            resolution = (float)cmd.cmdParams.resolution;
                            ConstructAcquisitionStartCmd();
                            chA = new byte[binNum * 4];
                            chB = new byte[binNum * 4];
                            resultCode = StartAcquisition();
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
                    string sendStr = "{\"cmdType\":\"" + (string)cmd.cmdType + "\",\"result\":" + resultCode + "}";
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

        private static int StartAcquisition()
        {
            if (CtrlEndPt != null)
            {
                int len = acquisitionStartCmd.Length;

                CtrlEndPt.Write(ref acquisitionStartCmd, ref len);
                //查询采集进度
                CheckAcquistionProgress();
                return 1;
            }
            else
                return -1;
        }

        private static void StopAcquisition()
        {
            if (CtrlEndPt != null)
            {
                int len = 2;
                byte[] buf = new byte[] { 0xC4, 0xa0 };
                CtrlEndPt.Write(ref buf, ref len);
            }
            if (checkProgressThr != null)
                checkProgressThr.Abort();
        }

        private static int CheckAcquisitionTimes()
        {
            return currentAccumNum;
        }

        private static int CheckAcquisitionRunning()
        {
            int rN = 2;
            var currentR = new int[rN];
            for (int i = 0; i < rN; i++)
            {
                currentR[i] = CheckAcquisitionTimes();
                System.Threading.Thread.Sleep(50);
            }
            if (currentR[1] != currentR[0])
                return 1;
            else
                return 0;
        }

        private static void CheckAcquistionProgress()
        {
            checkProgressThr = new Thread(() => CheckProgressLoop());
            checkProgressThr.Start();
        }

        private static void CheckProgressLoop()
        {
            if (CtrlEndPt != null)
            {
                try
                {
                    while (true)
                    {
                        int len = 2;
                        byte[] buf = new byte[] { 0xC1, 0x01 };
                        CtrlEndPt.Write(ref buf, ref len);

                        len = 512;
                        buf = new byte[len];

                        MyDevice.BulkInEndPt.XferData(ref buf, ref len);
                        currentAccumNum = (int)BitConverter.ToUInt32(buf, 1);
                        if (currentAccumNum >= accumTimes) break;
                        Thread.Sleep(40);
                    }
                    CheckAcquisitionChannelData(chA, chB);
                    Console.WriteLine(DateTime.Now + "   " + currentAccumNum);
                    Thread receiveThread = new Thread(UpdateAcquisitionDB);
                    receiveThread.Start();
                    StartAcquisition();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }
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

        private static int CheckAcquisitionChannelData(byte[] ChA, byte[] ChB)
        {
            if (CtrlEndPt != null)
            {
                var readLength = chA.Length;
                var readTimes = (int)Math.Ceiling(readLength / 512.0);
                byte readLen = (byte)(readTimes / 2);

                int len = 3;
                byte[] bufA = new byte[] { 0xC2, 0xca, readLen };
                CtrlEndPt.Write(ref bufA, ref len);

                len = 512;
                bufA = new byte[len];
                for (int i = 0; i < readTimes - 1; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufA, ref len);
                    Array.Copy(bufA, 0, ChA, 512 * i, 512);
                }
                MyDevice.BulkInEndPt.XferData(ref bufA, ref len);
                Array.Copy(bufA, 0, ChA, 512 * (readTimes - 1), readLength % 512);

                len = 3;
                byte[] bufB = new byte[] { 0xC2, 0xcb, readLen };
                CtrlEndPt.Write(ref bufB, ref len);

                len = 512;
                bufB = new byte[len];
                for (int i = 0; i < readTimes - 1; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufB, ref len);
                    Array.Copy(bufB, 0, ChB, 512 * i, 512);
                }
                MyDevice.BulkInEndPt.XferData(ref bufB, ref len);
                Array.Copy(bufB, 0, ChB, 512 * (readTimes - 1), readLength % 512);

                return 0;
            }
            else
                return -1;
         
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
    }
}
