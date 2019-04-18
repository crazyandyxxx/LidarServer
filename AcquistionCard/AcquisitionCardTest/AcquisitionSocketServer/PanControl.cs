using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        static SerialPort panPort = new SerialPort();

        private static void SetPanPort()
        {
            panPort.BaudRate = 2400;
            panPort.PortName = Properties.AcquisitionServerSetting.Default.PanPort;
            panPort.DataBits = 8;
            panPort.Parity = Parity.None;
            panPort.StopBits = StopBits.One;
            try
            {
                panPort.Open();
            }
            catch (Exception ex)
            {
                Console.WriteLine("转台串口打开失败!");
            }
        }

        private static void WaitPanToAngle()
        {
            var horN = (int)(((horEndAng - horStartAng)+360)%360 / horAngStep);
            var verN = (int)(((verEndAng - verStartAng)+360)%360 / verAngStep);
            if (mode == "PPI")
            {
                var horTargetAng = horStartAng + acquisitionCount % (horN + 1) * horAngStep;
                ToHorAngle(horTargetAng);
                int iloop = 0;
                while (iloop < 500)
                {
                    currentHorAng = HorPosition();
                    if (Math.Abs(currentHorAng - horTargetAng) < 0.5)
                    {
                        currentHorAng = horTargetAng;
                        break;
                    }
                    System.Threading.Thread.Sleep(50);
                    iloop++;
                }
                currentHorAng = horTargetAng;

                ToVerAngle(verStartAng);
                iloop = 0;
                while (iloop < 500)
                {
                    currentVerAng = VerPosition();
                    if (Math.Abs(currentVerAng - verStartAng) < 0.5)
                    {
                        currentVerAng = verStartAng;
                        break;
                    }
                    System.Threading.Thread.Sleep(50);
                    iloop++;
                }
                currentVerAng = verStartAng;
            }
            if (mode == "RHI")
            {
                var VerTargetAng = verStartAng + acquisitionCount % (verN + 1) * verAngStep;
                ToHorAngle(horStartAng);
                int iloop = 0;
                while (iloop < 500)
                {
                    currentHorAng = HorPosition();
                    if (Math.Abs(currentHorAng - horStartAng) < 0.5)
                    {
                        currentHorAng = horStartAng;
                        break;
                    }
                    System.Threading.Thread.Sleep(50);
                    iloop++;
                }
                currentHorAng = horStartAng;

                ToVerAngle(VerTargetAng);
                iloop = 0;
                while (iloop < 500)
                {
                    currentVerAng = VerPosition();
                    if (Math.Abs(currentVerAng - VerTargetAng) < 0.5)
                    {
                        currentVerAng = VerTargetAng;
                        break;
                    }
                    System.Threading.Thread.Sleep(50);
                    iloop++;
                }
                currentVerAng = VerTargetAng;
            }
        }

        private static void ToHorAngle(float angle)
        {
            byte[] PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4b, 0x00, 0x00, 0x00 };
            var bt = BitConverter.GetBytes((ushort)(angle * 100));
            PanPositionByte[4] = bt[1];
            PanPositionByte[5] = bt[0];
            PanPositionByte[6] = (byte)(bt[1] + bt[2] + bt[3] + bt[4] + bt[5]);
            SerialPortCommunicate(PanPositionByte, null, panPort);
        }

        private static void ToVerAngle(float angle)
        {
            byte[] PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4d, 0x00, 0x00, 0x00 };
            var bt = BitConverter.GetBytes((ushort)(angle * 100));
            PanPositionByte[4] = bt[1];
            PanPositionByte[5] = bt[0];
            PanPositionByte[6] = (byte)(bt[1] + bt[2] + bt[3] + bt[4] + bt[5]);
            SerialPortCommunicate(PanPositionByte, null, panPort);
        }

        private static float HorPosition()
        {
            float PanPos = 0;
            byte[] PanPositionByteRv = new byte[7];
            byte[] PanPositionByte = new byte[]{0xff,0x01,0x00,0x51,0x00,0x00,0x52};
            SerialPortCommunicate(PanPositionByte, PanPositionByteRv, panPort);
            PanPos = BitConverter.ToUInt16(new byte[] { PanPositionByteRv[5],PanPositionByteRv[4]}, 0)/100f;
            return PanPos;
        }

        private static float VerPosition()
        {
            float PanPos = 0;
            byte[] PanPositionByteRv = new byte[7];
            byte[] PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x53, 0x00, 0x00, 0x54 };
            SerialPortCommunicate(PanPositionByte, PanPositionByteRv, panPort);
            PanPos = BitConverter.ToUInt16(new byte[] { PanPositionByteRv[5], PanPositionByteRv[4] }, 0) / 100f;
            return PanPos;
        }

        private static void SerialPortCommunicate(byte[] wrData, byte[] rdData, SerialPort port)
        {
            if (port != null)
            {
                lock (port)
                {
                    port.DiscardInBuffer();
                    port.DiscardOutBuffer();
                    port.Write(wrData, 0, wrData.Length);
                    System.Threading.Thread.Sleep(100);
                    try
                    {
                        if (rdData != null && port.BytesToRead != 0) port.Read(rdData, 0, rdData.Length);
                    }
                    catch (System.Exception ex)
                    {
                        Console.WriteLine(port.PortName+"发送失败!");
                    }
                }
            }
        }
    }
}
