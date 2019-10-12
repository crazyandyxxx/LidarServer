using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.Linq;
using System.Text;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        private static void UpdateAcquisitionDB(double lon, double lat, double alti, double ver, double hor, byte[] A, byte[] B)
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + Properties.AcquisitionServerSetting.Default.DBPath);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                string s = taskId;
                int n = 100;
                cmd.CommandText = "SELECT * FROM task WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                SQLiteDataReader sr = cmd.ExecuteReader();
                while (sr.Read())
                {
                    n = sr.GetInt32(9);
                }
                sr.Close();

                cmd.CommandText = "UPDATE task SET data_num=@score,end_time=@time WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("score", DbType.Int32).Value = n + 1;
                var dt = DateTime.Now.ToString("s");
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.ExecuteNonQuery();

                cmd.CommandText = "INSERT INTO task_data(task_id,timestamp,longitude, latitude,altitude,ver_angle,hor_angle,raw_A,raw_B) VALUES(@id,@time,@lon,@lat,@alt,@ver,@hor,@a,@b)";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.Parameters.Add("lon", DbType.Single).Value = (float)lon;
                cmd.Parameters.Add("lat", DbType.Single).Value = (float)lat;
                cmd.Parameters.Add("alt", DbType.Single).Value = (float)alti;
                cmd.Parameters.Add("ver", DbType.Single).Value = (float)ver;
                cmd.Parameters.Add("hor", DbType.Single).Value = (float)hor;
                cmd.Parameters.Add("a", DbType.Binary).Value = A;
                cmd.Parameters.Add("b", DbType.Binary).Value = B;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

        private static void GetAquisitionParams()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + Properties.AcquisitionServerSetting.Default.DBPath);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                cmd.CommandText = "SELECT * FROM task WHERE complete=@complete ORDER BY end_time DESC Limit 1";
                cmd.Parameters.Add("complete", DbType.Boolean).Value = false;
                SQLiteDataReader sr = cmd.ExecuteReader();
                sr.Read();
                taskId = Guid.NewGuid().ToString();
                var freq = sr.GetInt32(3);
                var dur = sr.GetInt32(4);
                accumTimes = (uint)( freq * dur);
                binNum = (ushort)sr.GetInt32(6);
                resolution = sr.GetFloat(5);
                mode = sr.GetString(1);
                verStartAng = sr.GetFloat(10);
                verEndAng = sr.GetFloat(11);
                verAngStep = sr.GetFloat(12);
                horStartAng = sr.GetFloat(13);
                horEndAng = sr.GetFloat(14);
                horAngStep = sr.GetFloat(15);
                var id = sr.GetString(0);
                sr.Close();

                cmd.CommandText = "UPDATE task SET complete=@score WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = id;
                cmd.Parameters.Add("score", DbType.Boolean).Value = true;
                cmd.ExecuteNonQuery();

                cmd.CommandText = "INSERT INTO task(id,mode,description,laser_freq,duration,resolution,bin_length,"+
                                  "start_time,end_time,data_num,ver_start_angle,ver_end_angle,ver_step,hor_start_angle,"+
                                  "hor_end_angle,hor_step,complete) VALUES(@p0,@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,"+
                                  "@p11,@p12,@p13,@p14,@p15,@p16)";
                cmd.Parameters.Add("p0", DbType.String).Value = taskId;
                cmd.Parameters.Add("p1", DbType.String).Value = mode;
                cmd.Parameters.Add("p2", DbType.String).Value = "";
                cmd.Parameters.Add("p3", DbType.Int32).Value = freq;
                cmd.Parameters.Add("p4", DbType.Int32).Value = dur;
                cmd.Parameters.Add("p5", DbType.Single).Value = resolution;
                cmd.Parameters.Add("p6", DbType.Int32).Value = (Int32)binNum;
                var dt = DateTime.Now.ToString("s");
                cmd.Parameters.Add("p7", DbType.DateTime).Value = dt;
                cmd.Parameters.Add("p8", DbType.DateTime).Value = dt;
                cmd.Parameters.Add("p9", DbType.Int32).Value = 0;
                cmd.Parameters.Add("p10", DbType.Single).Value = verStartAng;
                cmd.Parameters.Add("p11", DbType.Single).Value = verEndAng;
                cmd.Parameters.Add("p12", DbType.Single).Value = verAngStep;
                cmd.Parameters.Add("p13", DbType.Single).Value = horStartAng;
                cmd.Parameters.Add("p14", DbType.Single).Value = horEndAng;
                cmd.Parameters.Add("p15", DbType.Single).Value = horAngStep;
                cmd.Parameters.Add("p16", DbType.Boolean).Value = false;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }
    }
}
