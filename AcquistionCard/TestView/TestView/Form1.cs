using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SQLite;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace TestView
{
    public partial class Form1 : Form
    {
        string path = @"C:\Server\LidarServer\app.db";
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                string s = textBox1.Text;
                List<DateTime> ldt = new List<DateTime>();
                List<int[]> lchA = new List<int[]>();
                List<int[]> lchB = new List<int[]>();
                cmd.CommandText = "SELECT * FROM task_data WHERE id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                SQLiteDataReader sr = cmd.ExecuteReader();
                while (sr.Read())
                {
                    ldt.Add(sr.GetDateTime(2));
                    var chA = sr.GetBlob(8,true);
                    var chB = sr.GetBlob(9, true);
                }
                sr.Close();

                //cmd.CommandText = "UPDATE task SET data_num=@score,end_time=@time WHERE id=@id";
                //cmd.Parameters.Add("id", DbType.String).Value = s;
                //cmd.Parameters.Add("score", DbType.Int32).Value = n + 1;
                //var dt = DateTime.Now.ToString("s");
                //cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                //cmd.ExecuteNonQuery();

                //cmd.CommandText = "INSERT INTO task_data(task_id,timestamp,raw_A,raw_B) VALUES(@id,@time,@a,@b)";
                //cmd.Parameters.Add("id", DbType.String).Value = s;
                //cmd.Parameters.Add("time", DbType.DateTime).Value = dt;
                //cmd.Parameters.Add("a", DbType.Binary).Value = chA;
                //cmd.Parameters.Add("b", DbType.Binary).Value = chB;
                //cmd.ExecuteNonQuery();
            }
            cn.Close();
        }
    }
}
