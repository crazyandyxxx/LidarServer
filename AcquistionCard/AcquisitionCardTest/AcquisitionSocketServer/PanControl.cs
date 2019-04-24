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
                return;
            }
            Thread.Sleep(200);
            currentVerAng = VerPosition();
            Thread.Sleep(200);
            currentHorAng = HorPosition();
        }

        private static void WaitPanToAngle()
        {
            var horAngDiff = horEndAng - horStartAng > 0 ? horEndAng - horStartAng : ((horEndAng - horStartAng) + 360) % 360;
            var horN = (int)(horAngDiff / horAngStep);
            var verN = (int)(((verEndAng - verStartAng)+360)%360 / verAngStep);
            if (mode == "PPI")
            {
                var horTargetAng = horStartAng + acquisitionCount % (horN + 1) * horAngStep;
                if (horTargetAng > 360) horTargetAng = horTargetAng % 360;
                ToHorAngle(horTargetAng);
                Thread.Sleep(500);
                ToHorAngle(horTargetAng);
                int iloop = 0;
                while (iloop < 50)
                {
                    Thread.Sleep(500);
                    currentHorAng = HorPosition();
                    if (IsInPosition(currentHorAng,horTargetAng))
                    {
                        currentHorAng = horTargetAng;
                        break;
                    }                  
                    iloop++;
                }
                currentHorAng = horTargetAng;

                ToVerAngle(verStartAng);
                Thread.Sleep(500);
                ToVerAngle(verStartAng);
                iloop = 0;
                while (iloop < 50)
                {
                    Thread.Sleep(500);
                    currentVerAng = VerPosition();
                    if (IsInPosition(currentVerAng, verStartAng))
                    {
                        currentVerAng = verStartAng;
                        break;
                    }
                    
                    iloop++;
                }
                currentVerAng = verStartAng;
            }
            if (mode == "RHI")
            {
                var VerTargetAng = verStartAng + acquisitionCount % (verN + 1) * verAngStep;
                ToHorAngle(horStartAng);
                Thread.Sleep(500);
                ToHorAngle(horStartAng);
                int iloop = 0;
                while (iloop < 50)
                {
                    Thread.Sleep(500);
                    currentHorAng = HorPosition();
                    if (IsInPosition(currentHorAng, horStartAng))
                    {
                        currentHorAng = horStartAng;
                        break;
                    }
                    
                    iloop++;
                }
                currentHorAng = horStartAng;

                ToVerAngle(VerTargetAng);
                Thread.Sleep(500);
                ToVerAngle(VerTargetAng);
                iloop = 0;
                while (iloop < 50)
                {
                    Thread.Sleep(500);
                    currentVerAng = VerPosition();
                    if (IsInPosition(currentVerAng, VerTargetAng))
                    {
                        currentVerAng = VerTargetAng;
                        break;
                    }
                    iloop++;
                }
                currentVerAng = VerTargetAng;
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

        private static void ToHorAngle(float angle)
        {
            byte[] PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4b, 0x00, 0x00, 0x00 };
            var bt = BitConverter.GetBytes((ushort)(angle * 100));
            PanPositionByte[4] = bt[1];
            PanPositionByte[5] = bt[0];
            PanPositionByte[6] = (byte)(PanPositionByte[1] + PanPositionByte[2] + PanPositionByte[3] + PanPositionByte[4] + PanPositionByte[5]);
            SerialPortCommunicate(PanPositionByte, null, panPort);
        }

        private static void ToVerAngle(float angle)
        {
            byte[] PanPositionByte = new byte[] { 0xff, 0x01, 0x00, 0x4d, 0x00, 0x00, 0x00 };
            var bt = BitConverter.GetBytes((ushort)(angle * 100));
            PanPositionByte[4] = bt[1];
            PanPositionByte[5] = bt[0];
            PanPositionByte[6] = (byte)(PanPositionByte[1] + PanPositionByte[2] + PanPositionByte[3] + PanPositionByte[4] + PanPositionByte[5]);
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
