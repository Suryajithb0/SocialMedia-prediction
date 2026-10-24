
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie,
  Cell, LineChart, Line
} from "recharts";
import {
  Activity, BrainCircuit, ChartNoAxesCombined, Clock3,
  LayoutDashboard, RefreshCw, Sparkles, TrendingUp,
  Users, Zap, CalendarDays, Target
} from "lucide-react";
import "./index.css";

const API = "http://127.0.0.1:8000";
const COLORS = ["#8b7cff", "#35d9cb", "#f6b95f", "#f17bb2", "#6ba8ff", "#a9e66e"];

const initialForm = {
  platform: "Instagram",
  post_type: "Reel",
  topic: "Technology",
  day_of_week: "Monday",
  posting_hour: 18,
  follower_count: 10000,
  caption_length_chars: 150,
  hashtag_count: 5,
  video_duration_seconds: 30,
  contains_call_to_action: 1,
  paid_promotion: 0,
  historical_avg_engagement_rate_pct: 5.5,
};

const formatNumber = (n) => Number(n || 0).toLocaleString("en-IN");

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item, i) => (
        <div key={i}>
          {item.name || "Engagement"}: {item.value}
          {item.name?.toLowerCase().includes("post") ? "" : "%"}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState("");
  const [activePage, setActivePage] = useState("Overview");

  async function loadAnalytics() {
    setLoadingData(true);
    setDataError("");
    try {
      const response = await fetch(`${API}/analytics`);
      if (!response.ok) throw new Error("Analytics endpoint returned an error.");
      setData(await response.json());
    } catch {
      setDataError("Cannot load analytics. Make sure your FastAPI server is running.");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  function updateForm(e) {
    const { name, value } = e.target;
    const numeric = [
      "posting_hour", "follower_count", "caption_length_chars",
      "hashtag_count", "video_duration_seconds",
      "historical_avg_engagement_rate_pct"
    ].includes(name);
    setForm((prev) => ({ ...prev, [name]: numeric ? Number(value) : value }));
  }

  async function predict(e) {
    e.preventDefault();
    setPredicting(true);
    setPredictError("");
    setPrediction(null);

    try {
      const response = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Prediction failed.");
      setPrediction(result.predicted_engagement_rate_pct);
    } catch (error) {
      setPredictError(error.message || "Could not connect to the prediction API.");
    } finally {
      setPredicting(false);
    }
  }

  const hours = data?.hourly_performance
    ? [...data.hourly_performance].sort((a, b) => Number(a.name) - Number(b.name))
      .map((x) => ({ ...x, name: `${String(x.name).padStart(2, "0")}:00` }))
    : [];

  const dailyOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const days = data?.daily_performance
    ? [...data.daily_performance].sort(
        (a, b) => dailyOrder.indexOf(a.name) - dailyOrder.indexOf(b.name)
      )
    : [];

  const pageItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Platform Insights", icon: ChartNoAxesCombined },
    { label: "AI Prediction", icon: BrainCircuit },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark"><Activity size={23} /></div>
          <div>PULSE<span>AI</span><small>ENGAGEMENT INTELLIGENCE</small></div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav>
          {pageItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                document.getElementById(
                  label === "AI Prediction" ? "prediction" :
                  label === "Platform Insights" ? "platform-insights" : "overview"
                )?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className="engine-icon"><BrainCircuit size={20} /></div>
            <strong>ML ENGINE</strong>
            <span><i /> Gradient Boosting</span>
            <small>Model ready for predictions</small>
          </div>
          <div className="version">PULSE AI <span>v2.0</span></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">WORKSPACE / ANALYTICS</span>
            <h1>Engagement Dashboard</h1>
          </div>
          <div className="top-actions">
            <div className="live-status"><i /> DATA DASHBOARD</div>
            <button className="refresh" onClick={loadAnalytics} title="Refresh analytics">
              <RefreshCw size={16} /> <span>Refresh</span>
            </button>
          </div>
        </header>

        {dataError && (
          <div className="error-banner">
            {dataError}
            <button onClick={loadAnalytics}>Retry</button>
          </div>
        )}

        {loadingData && !data && (
          <div className="loading-card"><RefreshCw className="spin" /> Loading dataset analytics...</div>
        )}

        <div id="overview" className="section-heading">
          <div>
            <span className="eyebrow">YOUR DATA AT A GLANCE</span>
            <h2>Performance overview <span className="star">✦</span></h2>
            <p>Insights calculated directly from your cleaned dataset.</p>
          </div>
          <div className="date-chip"><Activity size={15} /> Dataset analytics</div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-top"><span>Total posts</span><div className="kpi-icon purple"><Users size={19} /></div></div>
            <strong>{data ? formatNumber(data.total_posts) : "—"}</strong>
            <small>Records analyzed</small>
            <div className="kpi-line purple-line" />
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span>Average engagement</span><div className="kpi-icon teal"><TrendingUp size={19} /></div></div>
            <strong>{data ? `${data.average_engagement}%` : "—"}</strong>
            <small>Mean engagement rate</small>
            <div className="kpi-line teal-line" />
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span>Median engagement</span><div className="kpi-icon orange"><Target size={19} /></div></div>
            <strong>{data ? `${data.median_engagement}%` : "—"}</strong>
            <small>Middle observation</small>
            <div className="kpi-line orange-line" />
          </div>
          <div className="kpi-card">
            <div className="kpi-top"><span>High engagement</span><div className="kpi-icon pink"><Zap size={19} /></div></div>
            <strong>{data ? formatNumber(data.high_engagement_posts) : "—"}</strong>
            <small>Posts at 5% engagement or above</small>
            <div className="kpi-line pink-line" />
          </div>
        </div>

        <div className="chart-grid" id="platform-insights">
          <Panel title="Platform performance" subtitle="Average engagement by platform">
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.platform_performance || []} margin={{ top: 12, right: 8, left: -18, bottom: 5 }}>
                  <CartesianGrid stroke="#242941" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9199b9", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9199b9", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="engagement" name="Engagement" fill="#8b7cff" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Engagement distribution" subtitle="Posts grouped by engagement level">
            <div className="distribution-layout">
              <div className="pie-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.engagement_distribution || []} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={4} stroke="none">
                      {(data?.engagement_distribution || []).map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-center"><strong>{formatNumber(data?.total_posts)}</strong><span>POSTS</span></div>
              </div>
              <div className="legend">
                {(data?.engagement_distribution || []).map((entry, i) => (
                  <div className="legend-row" key={entry.name}>
                    <i style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{entry.name}</span><strong>{formatNumber(entry.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Posting-hour analysis" subtitle="Average engagement by hour of day">
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hours} margin={{ top: 10, right: 8, left: -18, bottom: 5 }}>
                  <defs><linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35d9cb" stopOpacity={0.32}/><stop offset="100%" stopColor="#35d9cb" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid stroke="#242941" vertical={false} />
                  <XAxis dataKey="name" interval={3} tick={{ fill: "#9199b9", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9199b9", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#35d9cb" fill="url(#hourFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Weekly performance" subtitle="Average engagement by day">
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={days} margin={{ top: 12, right: 10, left: -18, bottom: 5 }}>
                  <CartesianGrid stroke="#242941" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#9199b9", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9199b9", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#f6b95f" strokeWidth={2.5} dot={{ fill: "#f6b95f", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Content type comparison" subtitle="Which format has the highest average engagement">
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.content_performance || []} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="#242941" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#9199b9", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fill: "#b4bbd7", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="engagement" name="Engagement" fill="#a78bfa" radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Top-performing topics" subtitle="Ranked by average engagement">
            <div className="topic-list">
              {(data?.topic_performance || []).slice(0, 6).map((topic, i) => (
                <div className="topic-row" key={topic.name}>
                  <div className="topic-rank">{String(i + 1).padStart(2, "0")}</div>
                  <div className="topic-info"><strong>{topic.name}</strong><div className="topic-track"><div style={{ width: `${Math.max(0, Math.min(100, topic.engagement / Math.max(1, data?.average_engagement * 1.5) * 100))}%` }} /></div></div>
                  <strong className="topic-value">{topic.engagement}%</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <section id="prediction" className="prediction-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MACHINE LEARNING</span>
              <h2>Predict your next post <Sparkles size={21} className="inline-spark" /></h2>
              <p>Enter post details to estimate engagement with your trained model.</p>
            </div>
            <div className="date-chip"><BrainCircuit size={15} /> Gradient Boosting</div>
          </div>

          <div className="prediction-grid">
            <form className="panel prediction-form" onSubmit={predict}>
              <div className="form-grid">
                <div><label>Platform</label><select name="platform" value={form.platform} onChange={updateForm}>{["Instagram","TikTok","YouTube","Facebook","Twitter"].map(x => <option key={x}>{x}</option>)}</select></div>
                <div><label>Post format</label><select name="post_type" value={form.post_type} onChange={updateForm}>{["Reel","Image","Video","Carousel","Text","Story"].map(x => <option key={x}>{x}</option>)}</select></div>
                <div><label>Topic</label><select name="topic" value={form.topic} onChange={updateForm}>{["Technology","Lifestyle","Education","Food","Fashion","Travel","Entertainment","Fitness","Business"].map(x => <option key={x}>{x}</option>)}</select></div>
                <div><label>Day of week</label><select name="day_of_week" value={form.day_of_week} onChange={updateForm}>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(x => <option key={x}>{x}</option>)}</select></div>
                {[
                  ["posting_hour","Posting hour (0–23)",0,23,1],
                  ["follower_count","Follower count",0,100000000,1],
                  ["caption_length_chars","Caption length",0,100000,1],
                  ["hashtag_count","Hashtag count",0,1000,1],
                  ["video_duration_seconds","Video duration (seconds)",0,100000,1],
                  ["historical_avg_engagement_rate_pct","Historical engagement (%)",0,100,0.1],
                ].map(([name,label,min,max,step]) => (
                  <div key={name}><label>{label}</label><input required type="number" min={min} max={max} step={step} name={name} value={form[name]} onChange={updateForm}/></div>
                ))}
              </div>
              <div className="checkbox-row">
                <label><input type="checkbox" checked={!!form.contains_call_to_action} onChange={e => setForm({...form, contains_call_to_action: Number(e.target.checked)})}/> Call to action</label>
                <label><input type="checkbox" checked={!!form.paid_promotion} onChange={e => setForm({...form, paid_promotion: Number(e.target.checked)})}/> Paid promotion</label>
              </div>
              <button className="predict-button" disabled={predicting}>
                {predicting ? <><RefreshCw size={17} className="spin"/> Analyzing...</> : <><Sparkles size={17}/> Predict engagement <span>↗</span></>}
              </button>
              {predictError && <p className="error-text">{predictError}</p>}
            </form>

            <div className="panel prediction-result">
              <div className="result-orb"><BrainCircuit size={36}/></div>
              <span className="eyebrow">PREDICTION RESULT</span>
              <h3>{prediction !== null ? `${prediction.toFixed(2)}%` : "Ready to analyze"}</h3>
              <p>{prediction !== null ? "Estimated engagement rate for the post details you entered." : "Your prediction will appear here after you submit the form."}</p>
              {prediction !== null && (
                <div className="result-meter"><div style={{ width: `${Math.max(0, Math.min(100, prediction))}%` }}/></div>
              )}
              <div className="result-foot"><Clock3 size={15}/> Model estimate, not a guarantee</div>
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>✳ PULSE AI</span><span>Social Media Engagement Prediction</span><span><i/> Analytics API</span>
        </footer>
      </main>
    </div>
  );
}
