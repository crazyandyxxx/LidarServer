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
        private static void UpdateAcquisitionDB()
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
                cmd.Parameters.Add("lon", DbType.Single).Value = (float)longitude;
                cmd.Parameters.Add("lat", DbType.Single).Value = (float)latitude;
                cmd.Parameters.Add("alt", DbType.Single).Value = (float)altitude;
                cmd.Parameters.Add("ver", DbType.Single).Value = (float)currentVerAng;
                cmd.Parameters.Add("hor", DbType.Single).Value = (float)currentHorAng;
                cmd.Parameters.Add("a", DbType.Binary).Value = chA;
                cmd.Parameters.Add("b", DbType.Binary).Value = chB;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }      
    }
}
