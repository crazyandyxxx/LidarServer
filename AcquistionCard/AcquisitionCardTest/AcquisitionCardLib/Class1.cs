using CyUSB;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace AcquisitionCardLib
{
    public class AcquisitionCard
    {
        public CyUSBDevice CheckDevice()
        {
            //var path = @"C:\Server\Test\test.txt";
            //using (StreamWriter sw = new StreamWriter(path))
            //{
            //    sw.WriteLine("hero0");
            //    sw.WriteLine(CyConst.DEVICES_CYUSB);
            //}

            USBDeviceList usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);

            //using (StreamWriter sw = new StreamWriter(path))
            //{
            //    sw.WriteLine("hero1");
            //}

            var MyDevice = usbDevices[0] as CyUSBDevice;
            return MyDevice;
        }

        public int StartAcquisition(int AccumTimes, int BinNum, float resolution, int trigTh, int chATh, int chBTh, int chCTh)
        {
            //生成采集命令
            var accumTimes = (uint)AccumTimes;
            byte[] accumTimesBytes = BitConverter.GetBytes(accumTimes);

            var binNum = (ushort)BinNum;
            byte[] binNumBytes = BitConverter.GetBytes(binNum);

            var acquisitionStartCmd = new byte[17];

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

            byte[] trigThBytes = BitConverter.GetBytes((ushort)trigTh);
            byte[] chAThBytes = BitConverter.GetBytes((ushort)chATh);
            byte[] chBThBytes = BitConverter.GetBytes((ushort)chBTh);
            byte[] chCThBytes = BitConverter.GetBytes((ushort)chCTh);
            Array.Copy(trigThBytes, 0, acquisitionStartCmd, 8, 2);
            Array.Copy(chAThBytes, 0, acquisitionStartCmd, 10, 2);
            Array.Copy(chBThBytes, 0, acquisitionStartCmd, 12, 2);
            Array.Copy(chCThBytes, 0, acquisitionStartCmd, 14, 2);
            acquisitionStartCmd[16] = 0xff;

            //发送采集命令
            var myDevice = CheckDevice();
            if (myDevice != null)
            {
                var CtrlEndPt = myDevice.ControlEndPt;
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;
                int len = acquisitionStartCmd.Length;
                CtrlEndPt.Write(ref acquisitionStartCmd, ref len);
            }
            else
                return -1;//无采集卡

            return 0;
        }

        public int StopAcquisition()
        {
            //发送停止命令
            var myDevice = CheckDevice();
            if (myDevice != null)
            {
                var CtrlEndPt = myDevice.ControlEndPt;
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;
                int len = 2;
                byte[] buf = new byte[] { 0xC4, 0xa0 };
                CtrlEndPt.Write(ref buf, ref len);
            }
            else
                return -1;

            return 0;
        }

        public int CheckAcquisitionTimes()
        {
            var myDevice = CheckDevice();
            if (myDevice != null)
            {
                var CtrlEndPt = myDevice.ControlEndPt;
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
                myDevice.BulkInEndPt.XferData(ref buf, ref len);

                uint currentAccumNum = BitConverter.ToUInt32(buf, 1);

                return (int)currentAccumNum;
            }
            else
                return -1;
        }

        public int CheckAcquisitionRunning()
        {
            var myDevice = CheckDevice();
            if (myDevice != null)
            {
                var CtrlEndPt = myDevice.ControlEndPt;
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
                    myDevice.BulkInEndPt.XferData(ref buf, ref len);
                    currentR = buf[0];
                    System.Threading.Thread.Sleep(4);
                }

                return currentR;
            }
            else
                return -1;
        }

        public int CheckAcquisitionChannelData(int readLength, byte[] ChA, byte[] ChB)
        {
            var myDevice = CheckDevice();
            if (myDevice != null)
            {
                var CtrlEndPt = myDevice.ControlEndPt;
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;

                var readTimes = (int)Math.Ceiling(readLength / 512.0);
                byte readLen = (byte)(readTimes / 2);

                int len = 3;
                byte[] bufA = new byte[] { 0xC2, 0xca, readLen };
                CtrlEndPt.Write(ref bufA, ref len);

                len = 512;
                bufA = new byte[len];
                for (int i = 0; i < readTimes-1; i++)
                {
                    myDevice.BulkInEndPt.XferData(ref bufA, ref len);
                    Array.Copy(bufA, 0, ChA, 512 * i, 512);
                }
                myDevice.BulkInEndPt.XferData(ref bufA, ref len);
                Array.Copy(bufA, 0, ChA, 512 * (readTimes - 1), readLength % 512);

                len = 3;
                byte[] bufB = new byte[] { 0xC2, 0xcb, readLen };
                CtrlEndPt.Write(ref bufB, ref len);

                len = 512;
                bufB = new byte[len];
                for (int i = 0; i < readTimes - 1; i++)
                {
                    myDevice.BulkInEndPt.XferData(ref bufB, ref len);
                    Array.Copy(bufB, 0, ChB, 512 * i, 512);
                }
                myDevice.BulkInEndPt.XferData(ref bufB, ref len);
                Array.Copy(bufB, 0, ChB, 512 * (readTimes - 1), readLength % 512);

                return 0;
            }
            else
                return -1;
        }
    }
}
