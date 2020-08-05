using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        private static string CheckTempeHumi()
        {
            return "{\"temperature\":" + inerTemperature + ",\"humidity\":" + inerHumidity +
                   ",\"tempeNormal\":" + inerTempeNormal + ",\"humiNormal\":" + inerHumiNormal +
                   ",\"laserEnergy\":" + laserEnergy + ",\"realFrequency\":" + realFrequency + "}";
        }

        private static void SetTempeHumiThreshold()
        {
            byte[] tempeHumiByteRv = new byte[8];
            byte[] tempeOnByte = new byte[8];
            byte[] humiOnByte = new byte[8];

            tempeOnByte = new byte[] { 0x01, 0x06, 0x00, 0x0B, 0x00, 0x00, 0x00, 0x00 };//设置温度报警阈值
            var bt = BitConverter.GetBytes((ushort)(Properties.AcquisitionServerSetting.Default.TemperatureThreshold * 10));
            tempeOnByte[4] = bt[1];
            tempeOnByte[5] = bt[0];
            bt = CRC16_Modbus(new byte[] { tempeOnByte[0], tempeOnByte[1], tempeOnByte[2], tempeOnByte[3], tempeOnByte[4], tempeOnByte[5] });
            tempeOnByte[6] = bt[0];
            tempeOnByte[7] = bt[1];
            SerialPortCommunicate(tempeOnByte, tempeHumiByteRv, panPort);


            humiOnByte = new byte[] { 0x01, 0x06, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x00 };//设置湿度报警阈值
            bt = BitConverter.GetBytes((ushort)(Properties.AcquisitionServerSetting.Default.HumidityThreshold * 10));
            humiOnByte[4] = bt[1];
            humiOnByte[5] = bt[0];
            bt = CRC16_Modbus(new byte[] { humiOnByte[0], humiOnByte[1], humiOnByte[2], humiOnByte[3], humiOnByte[4], humiOnByte[5] });
            humiOnByte[6] = bt[0];
            humiOnByte[7] = bt[1];
            SerialPortCommunicate(humiOnByte, tempeHumiByteRv, panPort);

            Task.Factory.StartNew(() => GetTempeHumi());
        }

        private static void GetTempeHumi()
        {
            byte[] tempeHumiOnByte = new byte[8] { 0x01, 0x03, 0x00, 0x09, 0x00, 0x0C, 0x95, 0xCD };
            byte[] tempeHumiByteRv = new byte[30];
            byte[] powerByte = new byte[8] { 0x02, 0x03, 0x00, 0x09, 0x00, 0x01, 0x54, 0x3B };
            byte[] powerByteRv = new byte[7];
            while (true)
            {
                SerialPortCommunicate(tempeHumiOnByte, tempeHumiByteRv, panPort);
                inerTemperature = BitConverter.ToUInt16(new byte[2] { tempeHumiByteRv[4], tempeHumiByteRv[3] }, 0) / 10;
                inerHumidity = (BitConverter.ToUInt16(new byte[2] { tempeHumiByteRv[6], tempeHumiByteRv[5] }, 0) + 5) / 10;
                if (inerTemperature > 100) inerTemperature -= 200;
                inerTempeNormal = inerTemperature < Properties.AcquisitionServerSetting.Default.TemperatureThreshold ? 1 : 0;
                inerHumiNormal = inerHumidity < Properties.AcquisitionServerSetting.Default.HumidityThreshold ? 1 : 0;
                realFrequency = BitConverter.ToUInt16(new byte[2] { tempeHumiByteRv[20], tempeHumiByteRv[19] }, 0);
                laserEnergy = BitConverter.ToUInt16(new byte[2] { tempeHumiByteRv[22], tempeHumiByteRv[21] }, 0) / 10;
                Thread.Sleep(1000);      
                SerialPortCommunicate(powerByte, powerByteRv, panPort);
                SetScreenContent(tempeHumiByteRv, powerByteRv);
                Thread.Sleep(50);
                SetScreenGPS();
                Thread.Sleep(1000);
            }
        }
    }
}


