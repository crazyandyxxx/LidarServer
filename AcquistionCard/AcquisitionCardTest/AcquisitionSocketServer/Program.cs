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
using System.Threading.Tasks;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        //创建套接字  
        static Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        static byte[] result = new byte[1024];
        
        static void Main(string[] args)
        {
            SetGPSPort();
            SetPanPort();
            LoadOngoingTask();
            SocketServie();        
        }
        public static void SocketServie()
        {
            Console.WriteLine("采集服务已启动");
            string host = "0.0.0.0";//IP地址
            int port = 6016;//端口
            socket.Bind(new IPEndPoint(IPAddress.Parse(host), port));
            socket.Listen(100);//设定最多100个排队连接请求             
            Task.Factory.StartNew(() => ListenClientConnect(), TaskCreationOptions.LongRunning);//通过多线程监听客户端连接              
            Console.ReadLine();
        }
        public static void LoadOngoingTask()
        {
            var r = GetAquisitionParams();
            if (r)
            {
                ConstructAcquisitionStartCmd();
                chA = new byte[binNum * 4];
                chB = new byte[binNum * 4];
                StartAcquisitionProgress();
            }
        }
        /// <summary>  
        /// 监听客户端连接  
        /// </summary>  
        private static void ListenClientConnect()
        {
            while (true)
            {
                Socket clientSocket = socket.Accept();
                Task.Factory.StartNew(() => ReceiveMessage(clientSocket), TaskCreationOptions.LongRunning);

            }
        }
    }
}
