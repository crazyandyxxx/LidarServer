using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        static SerialPort panPort = new SerialPort();

        private static string CheckHeadingPitch()
        {
            return "{\"heading\":" + currentHorAng + ",\"pitch\":" + currentVerAng + "}";
        }

        private enum AngleType
        {
            Hor,
            Ver
        }

        private static void SetPanPort()
        {
            panPort.BaudRate = Properties.AcquisitionServerSetting.Default.PanPortRate;
            panPort.PortName = Properties.AcquisitionServerSetting.Default.PanPort;
            panPort.DataBits = 8;
            panPort.Parity = Parity.None;
            panPort.StopBits = StopBits.One;
            panPort.ReadTimeout = 1500;
            panPort.WriteTimeout = 1000;
            try
            {
                panPort.Open();
            }
            catch (Exception ex)
            {
                Console.WriteLine("转台串口打开失败!");
                return;
            }
            Thread.Sleep(80);
            currentVerAng = CurrentPosition(AngleType.Ver);
            currentHorAng = CurrentPosition(AngleType.Hor);
            SetTempeHumiThreshold();
        }

        private static void WaitPanToAngle()
        {
            var horAngDiff = horEndAng - horStartAng > 0 ? horEndAng - horStartAng : ((horEndAng - horStartAng) + 360) % 360;
            var horN = (int)(horAngDiff / horAngStep);
            var verN = (int)(((verEndAng - verStartAng)+360)%360 / verAngStep);
            if (mode == "PPI")
            {
                var horAng = horStartAng + acquisitionCount % (horN + 1) * horAngStep;
                //到第一组先回转
                var horRealEnd = horStartAng + horN * horAngStep;
                var horTargetAng = horAng;
                var verAng = verStartAng;
                //if (horAng == horStartAng)
                //{
                //    var backAngStep = (horRealEnd - horStartAng) / 3;
                //    for (int i = 1; i < 3; i++)
                //    {
                //        horTargetAng = horRealEnd - i * backAngStep;
                //        if (verAng > 90)
                //        {
                //            horTargetAng += 180;
                //        }
                //        horTargetAng = (horTargetAng + 360) % 360;
                //        ToAngle(horTargetAng, AngleType.Hor, 3, 200);
                //    }
                //}

                //horTargetAng = horAng;
                var verTargetAng = verAng;
                if (verAng > 90)
                {
                    verTargetAng = 180 - verTargetAng;
                    horTargetAng += 180; 
                }
                horTargetAng = (horTargetAng + 360) % 360;
                ToAngle(horTargetAng, AngleType.Hor, 3, 200);
                currentHorAng = horAng;
                verTargetAng = 360 - verTargetAng;
                ToAngle(verTargetAng, AngleType.Ver, 3, 200);
                currentVerAng = verAng;
            }
            if (mode == "RHI")
            {
                var verAng = verStartAng + acquisitionCount % (verN + 1) * verAngStep;
                var verTargetAng = verAng;
                var horAng = horStartAng;
                var horTargetAng = horAng;
                if (verAng > 90)
                {
                    verTargetAng = 180 - verTargetAng;
                    horTargetAng += 180;
                }
                horTargetAng = (horTargetAng + 360) % 360;
                ToAngle(horTargetAng, AngleType.Hor, 3, 200);
                currentHorAng = horAng;
                verTargetAng = 360 - verTargetAng;
                ToAngle(verTargetAng, AngleType.Ver, 3, 200);
                currentVerAng = verAng;
            }
        }

        private static bool IsInPosition(float currentAng, float targetAng)
        {
            if (Math.Abs(currentAng - targetAng) < 0.5)
                return true;

            if (targetAng < 1 || targetAng > 359)
            {
                if (currentAng < 1 || currentAng > 359)
                    return true;
            }
            return false;
        }

        private static void ToAngle(float angle, AngleType angType, int repeatTimes, int interval)
        {
            byte[] PanPositionByte = new byte[7];
            if (angType == AngleType.Hor)
            {
                PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4b, 0x00, 0x00, 0x00 };
            }
            else if (angType == AngleType.Ver)
            {
                PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4d, 0x00, 0x00, 0x00 };
            }
            var bt = BitConverter.GetBytes((ushort)(angle * 100));
            PanPositionByte[4] = bt[1];
            PanPositionByte[5] = bt[0];
            PanPositionByte[6] = (byte)(PanPositionByte[1] + PanPositionByte[2] + PanPositionByte[3] + PanPositionByte[4] + PanPositionByte[5]);
            for (int i = 0; i < repeatTimes; i++)
            {
                SerialPortCommunicate(PanPositionByte, null, panPort);
                Thread.Sleep(interval);
            }

            int iloop = 0;
            while (iloop < 200)
            {
                Thread.Sleep(100);
                if (IsInPosition(CurrentPosition(angType), angle))
                {
                    break;
                }
                iloop++;
            }
        }

        private static float CurrentPosition(AngleType angType)
        {
            float PanPos = 0;
            byte[] PanPositionByteRv = new byte[7];
            byte[] PanPositionByte = new byte[7];
            if (angType == AngleType.Hor)
            {
                PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x51, 0x00, 0x00, 0x52 };
            }
            else if (angType == AngleType.Ver)
            {
                PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x53, 0x00, 0x00, 0x54 };
            }
            SerialPortCommunicate(PanPositionByte, PanPositionByteRv, panPort);
            PanPos = BitConverter.ToUInt16(new byte[] { PanPositionByteRv[5],PanPositionByteRv[4]}, 0)/100f;
            return PanPos;
        }

        private static void SerialPortCommunicate(byte[] wrData, byte[] rdData, SerialPort port)
        {
            if (port.IsOpen)
            {
                lock (port)
                {
                    try
                    {
                        port.DiscardInBuffer();
                        port.DiscardOutBuffer();
                        port.Write(wrData, 0, wrData.Length);
                        Thread.Sleep(80);
                        if (rdData != null && port.BytesToRead != 0)
                        {
                            port.Read(rdData, 0, rdData.Length);
                            Thread.Sleep(80);
                        }
                        Thread.Sleep(1000);
                    }
                    catch (System.Exception ex)
                    {
                        Console.WriteLine(ex.ToString());
                    }
                }
            }
        }
    }
}
