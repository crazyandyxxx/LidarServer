using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO.Ports;
using System.Threading;

namespace AcquisitionSocketServer
{
    partial class Program 
    {
        static SerialPort screenPort = new SerialPort();

        private static void SetScreenPort()
        {
            screenPort.BaudRate = Properties.AcquisitionServerSetting.Default.ScreenPortRate;
            screenPort.PortName = Properties.AcquisitionServerSetting.Default.ScreenPort;
            screenPort.DataBits = 8;
            screenPort.Parity = Parity.None;
            screenPort.StopBits = StopBits.One;
            screenPort.ReadTimeout = 1000;
            screenPort.WriteTimeout = 1000;
            try
            {
                screenPort.Open();
            }
            catch (Exception ex)
            {
                Console.WriteLine("屏显串口打开失败!");
                return;
            }
            Thread.Sleep(80);
        }

        private static void SetScreenContent(byte[] tempeHumiByteRv)
        {
            byte[] powerByte = new byte[8] { 0x02, 0x03, 0x00, 0x09, 0x00, 0x01, 0x54, 0x3B };
            byte[] powerByteRv = new byte[7];
            SerialPortCommunicate(powerByte, powerByteRv, panPort);

            byte[] screenByte = new byte[30] { 0x5A, 0xA5, 0x1B, 0x82, 0x10, 0x00, 0x00, 0x63,
                                               0x01, 0x45, 0x01, 0x4B, 0x01, 0x11, 0x01, 0xDB,
                                               0x26, 0xCF, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00,
                                               0x0D, 0x77, 0x00, 0x98, 0x00, 0xFF };
            var bt = BitConverter.GetBytes((ushort)(currentAccumNum * 100.0 / accumTimes));
            screenByte[6] = bt[1];
            screenByte[7] = bt[0];
            screenByte[8] = tempeHumiByteRv[3];
            screenByte[9] = tempeHumiByteRv[4];
            screenByte[10] = tempeHumiByteRv[5];
            screenByte[11] = tempeHumiByteRv[6];
            screenByte[12] = tempeHumiByteRv[11];
            screenByte[13] = tempeHumiByteRv[12];
            screenByte[14] = tempeHumiByteRv[13];
            screenByte[15] = tempeHumiByteRv[14];
            screenByte[16] = tempeHumiByteRv[15];
            screenByte[17] = tempeHumiByteRv[16];
            screenByte[18] = tempeHumiByteRv[17];
            screenByte[19] = tempeHumiByteRv[18];
            screenByte[20] = tempeHumiByteRv[19];
            screenByte[21] = tempeHumiByteRv[20];
            screenByte[22] = tempeHumiByteRv[21];
            screenByte[23] = tempeHumiByteRv[22];
            screenByte[24] = tempeHumiByteRv[23];
            screenByte[25] = tempeHumiByteRv[24];
            screenByte[26] = tempeHumiByteRv[25];
            screenByte[27] = tempeHumiByteRv[26];
            screenByte[28] = powerByteRv[3];
            screenByte[29] = powerByteRv[4];
            //Console.WriteLine("{0}", string.Join(", ", screenByte));
            SerialPortCommunicate(screenByte, null, screenPort);
        }

        private static void SetScreenGPS()
        {
            byte[] gpsChar = new byte[23] { 0x5A, 0xA5, 0x14, 0x82, 0x10, 0x0F, 0x20, 0x20, 0x20, 0x20,
                                            0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20,
                                            0x20, 0x20, 0x20, 0x20, 0x20};
            var lonChar = (int)(longitude * 10000);
            var latChar = (int)(latitude * 10000);
            List<byte> lonList = new List<byte>();
            List<byte> latList = new List<byte>();
            for (int i = 0; i < 7; i++ )
            {
                lonList.Add((byte)(lonChar % 10 + 0x30));
                lonChar /= 10;
            }
            for (int i = 0; i < 7; i++)
            {
                latList.Add((byte)(latChar % 10 + 0x30));
                latChar /= 10;
            }
            lonList.Insert(4, 0x2E);
            latList.Insert(4, 0x2E);
            lonList.Reverse();
            lonList.Add(0x2c);
            latList.Reverse();
            lonList.AddRange(latList);
            for (int i = 0; i < lonList.Count; i++)
            {
                gpsChar[6 + i] = lonList[i];
            }
            SerialPortCommunicate(gpsChar, null, screenPort);
        }
    }
}
