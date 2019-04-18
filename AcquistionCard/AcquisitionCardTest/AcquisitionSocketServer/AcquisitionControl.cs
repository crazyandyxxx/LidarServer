using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        static byte[] acquisitionStartCmd = new byte[17];
        static Thread dbThread;
        static CancellationTokenSource cts = new CancellationTokenSource();

        private static void StartAcquisitionProgress()
        {
            //AcquisitionProgressThr = new Thread(() => AcquisitionProgressLoop());
            //AcquisitionProgressThr.Start();
            Task.Factory.StartNew(() => AcquisitionProgressLoop(),cts.Token);
        }

        private static void StopAcquisitionProgress()
        {
            if (CtrlEndPt != null)
            {
                int len = 2;
                byte[] buf = new byte[] { 0xC4, 0xa0 };
                CtrlEndPt.Write(ref buf, ref len);
            }
            //if (AcquisitionProgressThr != null)
            //    AcquisitionProgressThr.Abort();
            cts.Cancel();

            acquisitionCount = 0;
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

        private static void AcquisitionProgressLoop()
        {
            if (CtrlEndPt != null)
            {
                while (true)
                {
                    try
                    {
                        WaitPanToAngle();//等待电机转到指定位置
                        StartAcquisition();//开始采集
                        WaitAcquistionFinish();//等待采集结束
                        CheckAcquisitionChannelData(chA, chB);//读取通道数据
                        acquisitionCount++;//采集组数递增
                        Console.WriteLine(DateTime.Now + "   " + acquisitionCount+"   "+ currentAccumNum);
                        //dbThread = new Thread(UpdateAcquisitionDB);//数据入库
                        //dbThread.Start();                      
                        Task.Factory.StartNew(() => UpdateAcquisitionDB());
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }
            }
        }

        private static int StartAcquisition()
        {
            if (CtrlEndPt != null)
            {
                int len = acquisitionStartCmd.Length;
                CtrlEndPt.Write(ref acquisitionStartCmd, ref len);
                return 1;
            }
            else
                return -1;
        }

        private static void WaitAcquistionFinish()
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
