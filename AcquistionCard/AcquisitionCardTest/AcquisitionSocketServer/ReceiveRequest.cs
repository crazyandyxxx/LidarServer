using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        /// <summary>  
        /// 接收消息  
        /// </summary>  
        /// <param name="clientSocket"></param>  
        private static void ReceiveMessage(object clientSocket)
        {
            Socket myClientSocket = (Socket)clientSocket;
            //while (true)
            //{
                try
                {
                    //通过clientSocket接收数据  
                    int receiveNumber = myClientSocket.Receive(result);
                    if (receiveNumber == 0)
                        return;
                    //Console.WriteLine("接收客户端{0} 的消息：{1}", myClientSocket.RemoteEndPoint.ToString(), Encoding.UTF8.GetString(result, 0, receiveNumber));
                    dynamic cmd = JsonConvert.DeserializeObject(Encoding.UTF8.GetString(result, 0, receiveNumber));
                    string resultCode="";
                    switch ((string)cmd.cmdType)
                    {
                        case "acqStart":
                            SetAcquistionParams(cmd);
                            ConstructAcquisitionStartCmd();
                            chA = new byte[binNum * 4];
                            chB = new byte[binNum * 4];
                            StartAcquisitionProgress();
                            resultCode = "1";
                            break;

                        case "acqStop":
                            StopAcquisitionProgress();
                            resultCode = "1";
                            break;

                        case "acqProgress":
                            resultCode = CheckAcquisitionTimes().ToString();
                            break;

                        case "acqRunning":
                            resultCode = CheckAcquisitionRunning().ToString();
                            break;

                        case "acqGPS":
                            resultCode = CheckLonLatAlt();
                            break;

                        case "headingpitch":
                            resultCode = CheckHeadingPitch();
                            break;
                    }

                    //给Client端返回信息
                    string sendStr = "{\"cmdType\":\"" + (string)cmd.cmdType + "\",\"result\":" + resultCode + "}";
                    byte[] bs = Encoding.UTF8.GetBytes(sendStr);//Encoding.UTF8.GetBytes()不然中文会乱码
                    myClientSocket.Send(bs, bs.Length, 0);  //返回信息给客户端
                    myClientSocket.Close(); //发送完数据关闭Socket并释放资源
                    //Console.ReadLine();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    myClientSocket.Shutdown(SocketShutdown.Both);//禁止发送和上传
                    myClientSocket.Close();//关闭Socket并释放资源
                    //break;
                }
            //}
        }
    }
}
