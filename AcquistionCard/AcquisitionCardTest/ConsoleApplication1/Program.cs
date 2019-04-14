using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.Linq;
using System.Text;

namespace ConsoleApplication1
{
    class Program
    {
        //数据库连接

        //static string path = @"c:\server\test\123.db";
        static string path = @"C:\Server\LidarServer\app.db";

        static void Main(string[] args)
        {
            //var acCard = new AcquisitionCardLib.AcquisitionCard();

            //acCard.StartAcquisition(25000,2000,15,680, 680, 680, 680);
            //var times = 0;
            //while(times<25000)
            //{
            //    times = acCard.CheckAcquisitionTimes();
            //    System.Threading.Thread.Sleep(100);
            //}
            byte[] cha = new byte[8000];
            byte[] chb = new byte[8000];
            //acCard.CheckAcquisitionChannelData(8000, cha, chb);           
            //CreateDB();
            //CreateTable();
            //AddColumn();
            //InsertTable();
            UpdateTable();
        }

        //---创建数据库
        static void CreateDB()
        {
            
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            cn.Open();
            cn.Close();
        }

        static void CreateTable()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                cmd.CommandText = "CREATE TABLE t1(id varchar(4),score int)";
                //cmd.CommandText = "CREATE TABLE IF NOT EXISTS t1(id varchar(4),score int)";
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

        static void InsertTable()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                string s = "123456";
                int n = 10;
                cmd.CommandText = "INSERT INTO t1(id,score) VALUES(@id,@score)";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("score", DbType.Int32).Value = n;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

        static void AddColumn()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                cmd.CommandText = "ALTER TABLE t1 ADD COLUMN time datetime";
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

        static void UpdateTable()
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                string s = "f62b0206-5b6e-47d6-9cae-5d94f5bbe2f9";
                int n = 100;
                cmd.CommandText = "SELECT * FROM task WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                SQLiteDataReader sr = cmd.ExecuteReader();
                while (sr.Read())
                {
                    n = sr.GetInt32(9);
                }
                sr.Close();
                var chA = new byte[8000];
                var chB = new byte[8000];
                cmd.CommandText = "UPDATE task SET data_num=@score,end_time=@time WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("score", DbType.Int32).Value = n + 1;
                var dt = DateTime.Now.ToString("s");
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.ExecuteNonQuery();

                cmd.CommandText = "INSERT INTO task_data(task_id,timestamp,raw_A,raw_B) VALUES(@id,@time,@a,@b)";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                cmd.Parameters.Add("a", DbType.Binary).Value = chA;
                cmd.Parameters.Add("b", DbType.Binary).Value = chB;
                cmd.ExecuteNonQuery();
            }
            cn.Close();
        }

    }
}
