using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        static SerialPort gpsPort = new SerialPort();

        private static string CheckLonLatAlt()
        {
            return "{\"longitude\":" + longitude + ",\"latitude\":" + latitude + ",\"altitude\":" + altitude + "}";
        }

        private static void SetGPSPort()
        {
            gpsPort.BaudRate = 9600;
            gpsPort.PortName = Properties.AcquisitionServerSetting.Default.GPSPort;
            gpsPort.DataBits = 8;
            gpsPort.Parity = Parity.None;
            gpsPort.StopBits = StopBits.One;
            try
            {
                gpsPort.Open();
            }
            catch (Exception ex)
            {
                Console.WriteLine("GPS串口打开失败!");
                return;
            }
            gpsPort.DataReceived += GPSDataReceived;
        }

        private static void GPSDataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            latitude = longitude = altitude = -99999;
            try
            {
                string resp = gpsPort.ReadLine();
                if (resp.StartsWith("$GNGGA"))
                {
                    string[] values = resp.Split(',');
                    if (values.Length == 15)
                    {
                        if (string.Compare(values[6], "0") != 0)
                        {
                            float lat = 0, lng = 0, alt = 0;
                            if (float.TryParse(values[2], out lat) && float.TryParse(values[4], out lng) && float.TryParse(values[9], out alt))
                            {
                                latitude = lat;
                                longitude = lng;
                                altitude = alt;

                                float d = (float)Math.Floor(latitude / 100.0);
                                latitude = d + (latitude - d * 100.0f) / 60.0f;

                                d = (float)Math.Floor(longitude / 100.0);
                                longitude = d + (longitude - d * 100.0f) / 60.0f;

                                if (string.Compare(values[3], "S") == 0)
                                    latitude = -latitude;

                                if (string.Compare(values[5], "W") == 0)
                                    longitude = -longitude;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

        }
    }
}
