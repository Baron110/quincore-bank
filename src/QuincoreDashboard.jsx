// QuincoreDashboard.jsx — QuinCore Bank Dashboard (Full Featured)
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Grid, Paper, Typography, Button, IconButton, Avatar,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, InputLabel, FormControl, Alert, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Badge, useMediaQuery, useTheme, Skeleton, Tab, Tabs,
  LinearProgress, Switch, FormControlLabel,
} from "@mui/material";
import {
  Dashboard as DashboardIcon, Send, Add, RequestPage, Receipt,
  AccountBalanceWallet, CreditCard, BarChart, Person, Logout,
  ArrowUpward, ArrowDownward, Menu as MenuIcon, Close, Visibility,
  VisibilityOff, ContentCopy, CheckCircle, TrendingUp, SwapHoriz,
  Notifications, Settings, FilterList, Search, AccountCircle,
  AttachMoney, Home, PhoneAndroid, Wifi, LocalGas, ShoppingCart,
} from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip as ChartTooltip, Legend, ArcElement, Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, ArcElement, Filler);

// ─── Constants ───────────────────────────────────────────────────────────────
const BILL_TYPES = [
  { label: "Electricity", icon: <AttachMoney />, category: "Utilities" },
  { label: "Water", icon: <Home />, category: "Utilities" },
  { label: "Internet", icon: <Wifi />, category: "Utilities" },
  { label: "Mobile / Phone", icon: <PhoneAndroid />, category: "Utilities" },
  { label: "Gas", icon: <LocalGas />, category: "Utilities" },
  { label: "Rent", icon: <Home />, category: "Housing" },
  { label: "Subscription", icon: <Receipt />, category: "Entertainment" },
  { label: "Insurance", icon: <AccountBalanceWallet />, category: "Finance" },
  { label: "Shopping", icon: <ShoppingCart />, category: "Shopping" },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: <DashboardIcon />, key: "dashboard" },
  { label: "Transactions", icon: <SwapHoriz />, key: "transactions" },
  { label: "Virtual Card", icon: <CreditCard />, key: "card" },
  { label: "Analytics", icon: <BarChart />, key: "analytics" },
  { label: "Profile", icon: <Person />, key: "profile" },
];

function getTierColor(tier) {
  return { Platinum: "#b28900", Gold: "#d4a017", Silver: "#888", Bronze: "#cd7f32" }[tier] || "#7c5cbf";
}
function getTierBg(tier) {
  return {
    Platinum: "linear-gradient(135deg,#6a4c00,#b28900)",
    Gold: "linear-gradient(135deg,#7a5200,#d4a017)",
    Silver: "linear-gradient(135deg,#444,#888)",
    Bronze: "linear-gradient(135deg,#6e3800,#cd7f32)",
  }[tier] || "linear-gradient(135deg,#4a2a9a,#7c5cbf)";
}
function generateTxnId() { return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`; }
function now() {
  return { date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() };
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function ActionModal({ open, onClose, title, children, onSubmit, loading, submitLabel = "Confirm", submitDisabled }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
        {title}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading || submitDisabled} variant="contained"
          sx={{ borderRadius: 3, bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" }, minWidth: 100 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function QuincoreDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals
  const [sendModal, setSendModal] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [billModal, setBillModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Send Money form
  const [sendForm, setSendForm] = useState({ recipientEmail: "", amount: "", purpose: "" });
  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");
  // Request form
  const [requestForm, setRequestForm] = useState({ recipientEmail: "", amount: "", note: "" });
  // Bill form
  const [billForm, setBillForm] = useState({ billType: "", amount: "", accountRef: "" });

  // Card
  const [showCvv, setShowCvv] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);

  // Transactions filter
  const [txnFilter, setTxnFilter] = useState("all");
  const [txnSearch, setTxnSearch] = useState("");

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Load user data (real-time) ─────────────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate("/signin"); return; }
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
        setLoading(false);
      } else {
        navigate("/signin");
      }
    });
    return () => unsub();
  }, [navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = useCallback((amount) => {
    const sym = userData?.currencySymbol || "$";
    return `${sym}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [userData]);

  const addTransaction = async (uid, txn, balanceDelta) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const current = snap.data();
    await updateDoc(ref, {
      balance: current.balance + balanceDelta,
      transactions: arrayUnion(txn),
    });
  };

  const clearModal = () => {
    setActionError(""); setActionSuccess("");
    setSendForm({ recipientEmail: "", amount: "", purpose: "" });
    setDepositAmount("");
    setRequestForm({ recipientEmail: "", amount: "", note: "" });
    setBillForm({ billType: "", amount: "", accountRef: "" });
  };

  // ── Send Money ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setActionError(""); setActionLoading(true);
    const amount = parseFloat(sendForm.amount);
    if (!sendForm.recipientEmail || !sendForm.amount || amount <= 0) {
      setActionError("Please fill all fields."); setActionLoading(false); return;
    }
    if (sendForm.recipientEmail.toLowerCase() === userData.email.toLowerCase()) {
      setActionError("You cannot send money to yourself."); setActionLoading(false); return;
    }
    if (amount > userData.balance) {
      setActionError("Insufficient balance."); setActionLoading(false); return;
    }
    try {
      // Find recipient
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("email", "==", sendForm.recipientEmail.toLowerCase().trim()));
      const snap = await getDocs(q);

      const ts = now(); const txnId = generateTxnId();
      const senderTxn = {
        id: txnId, type: "sent", amount, description: `Sent to ${sendForm.recipientEmail}`,
        purpose: sendForm.purpose || "Transfer", ...ts, status: "completed", category: "Transfer",
      };

      const uid = auth.currentUser.uid;
      await addTransaction(uid, senderTxn, -amount);

      if (!snap.empty) {
        const recipientDoc = snap.docs[0];
        const recipientTxn = {
          id: generateTxnId(), type: "received", amount,
          description: `Received from ${userData.email}`,
          purpose: sendForm.purpose || "Transfer", ...ts, status: "completed", category: "Transfer",
        };
        await addTransaction(recipientDoc.id, recipientTxn, amount);
      }

      setActionSuccess(`${fmt(amount)} sent successfully!`);
      setTimeout(() => { setSendModal(false); clearModal(); }, 1800);
    } catch (e) {
      setActionError("Transfer failed: " + e.message);
    } finally { setActionLoading(false); }
  };

  // ── Deposit ─────────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10) { setActionError("Minimum deposit is 10."); return; }
    setActionLoading(true); setActionError("");
    try {
      const uid = auth.currentUser.uid;
      const txn = {
        id: generateTxnId(), type: "deposit", amount,
        description: "Manual deposit", ...now(), status: "completed", category: "Deposit",
      };
      await addTransaction(uid, txn, amount);
      setActionSuccess(`${fmt(amount)} deposited successfully!`);
      setTimeout(() => { setDepositModal(false); clearModal(); }, 1800);
    } catch (e) { setActionError(e.message); }
    finally { setActionLoading(false); }
  };

  // ── Request Money ───────────────────────────────────────────────────────────
  const handleRequest = async () => {
    const amount = parseFloat(requestForm.amount);
    if (!requestForm.recipientEmail || isNaN(amount) || amount <= 0) {
      setActionError("Please fill all fields."); return;
    }
    setActionLoading(true); setActionError("");
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("email", "==", requestForm.recipientEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      const uid = auth.currentUser.uid;
      const txn = {
        id: generateTxnId(), type: "request", amount,
        description: `Money request sent to ${requestForm.recipientEmail}`,
        note: requestForm.note, ...now(), status: "pending", category: "Request",
      };
      await updateDoc(doc(db, "users", uid), { transactions: arrayUnion(txn) });
      if (!snap.empty) {
        const reqTxn = {
          id: generateTxnId(), type: "request_received", amount,
          description: `${userData.email} requested money from you`,
          note: requestForm.note, ...now(), status: "pending", category: "Request",
        };
        await updateDoc(doc(db, "users", snap.docs[0].id), { transactions: arrayUnion(reqTxn) });
      }
      setActionSuccess("Money request sent!");
      setTimeout(() => { setRequestModal(false); clearModal(); }, 1800);
    } catch (e) { setActionError(e.message); }
    finally { setActionLoading(false); }
  };

  // ── Pay Bill ────────────────────────────────────────────────────────────────
  const handleBill = async () => {
    const amount = parseFloat(billForm.amount);
    if (!billForm.billType || isNaN(amount) || amount <= 0) { setActionError("Fill all fields."); return; }
    if (amount > userData.balance) { setActionError("Insufficient balance."); return; }
    setActionLoading(true); setActionError("");
    try {
      const uid = auth.currentUser.uid;
      const txn = {
        id: generateTxnId(), type: "bill", amount,
        description: `${billForm.billType} bill payment`,
        accountRef: billForm.accountRef, ...now(), status: "completed", category: "Bills",
      };
      await addTransaction(uid, txn, -amount);
      setActionSuccess(`${billForm.billType} bill of ${fmt(amount)} paid!`);
      setTimeout(() => { setBillModal(false); clearModal(); }, 1800);
    } catch (e) { setActionError(e.message); }
    finally { setActionLoading(false); }
  };

  // ── Profile Update ──────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`;
      await updateDoc(doc(db, "users", uid), {
        firstName: profileForm.firstName, lastName: profileForm.lastName,
        fullName, phone: profileForm.phone, address: profileForm.address,
      });
      setEditProfile(false);
    } catch (e) { console.error(e); }
    finally { setProfileLoading(false); }
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "#f5f0ff" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#7c5cbf" }} size={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading your account…</Typography>
        </Box>
      </Box>
    );
  }

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const txns = userData?.transactions || [];
  const last6months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString("en", { month: "short" });
  });

  const spendByMonth = last6months.map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth(); const y = d.getFullYear();
    return txns.filter((t) => {
      const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y && ["sent", "bill"].includes(t.type);
    }).reduce((s, t) => s + t.amount, 0);
  });

  const lineData = {
    labels: last6months,
    datasets: [{
      label: "Spending", data: spendByMonth,
      borderColor: "#7c5cbf", backgroundColor: "rgba(124,92,191,0.12)",
      tension: 0.4, fill: true, pointBackgroundColor: "#7c5cbf", pointRadius: 4,
    }],
  };

  const cats = ["Transfer", "Deposit", "Bills", "Request"];
  const catTotals = cats.map((cat) => txns.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0));
  const doughnutData = {
    labels: cats,
    datasets: [{ data: catTotals, backgroundColor: ["#7c5cbf", "#4caf50", "#ff9800", "#2196f3"], borderWidth: 0, hoverOffset: 8 }],
  };

  // ── Filtered Transactions ───────────────────────────────────────────────────
  const filteredTxns = [...txns]
    .reverse()
    .filter((t) => {
      if (txnFilter !== "all" && t.type !== txnFilter) return false;
      if (txnSearch && !t.description.toLowerCase().includes(txnSearch.toLowerCase())) return false;
      return true;
    });

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <Box sx={{ width: 240, height: "100%", display: "flex", flexDirection: "column", bgcolor: "#1a0533" }}>
      <Box sx={{ p: 2.5, borderBottom: "1px solid #3a1a6a" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#7c5cbf", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AccountBalanceWallet sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography fontWeight={800} sx={{ color: "#fff", fontSize: "1rem", letterSpacing: "-0.3px" }}>
            QuinCore <span style={{ color: "#a78bfa" }}>Bank</span>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, borderBottom: "1px solid #3a1a6a" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#7c5cbf", width: 40, height: 40, fontWeight: 700 }}>
            {userData?.firstName?.[0]}{userData?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: "#fff" }}>{userData?.fullName}</Typography>
            <Chip label={userData?.accountType} size="small"
              sx={{ bgcolor: getTierColor(userData?.accountType), color: "#fff", fontSize: "0.65rem", height: 18, mt: 0.3 }} />
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, py: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.key} onClick={() => { setActiveTab(item.key); setDrawerOpen(false); }} disablePadding
            sx={{ cursor: "pointer" }}>
            <Box sx={{
              display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.2, mx: 1, borderRadius: 2, width: "100%",
              bgcolor: activeTab === item.key ? "#7c5cbf22" : "transparent",
              borderLeft: activeTab === item.key ? "3px solid #7c5cbf" : "3px solid transparent",
              transition: "all 0.2s", "&:hover": { bgcolor: "#7c5cbf15" },
            }}>
              <Box sx={{ color: activeTab === item.key ? "#a78bfa" : "#8070a0", display: "flex" }}>{item.icon}</Box>
              <Typography variant="body2" fontWeight={activeTab === item.key ? 700 : 500}
                sx={{ color: activeTab === item.key ? "#fff" : "#a090c0" }}>
                {item.label}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: "1px solid #3a1a6a" }}>
        <Button fullWidth onClick={handleSignOut} startIcon={<Logout />}
          sx={{ color: "#a090c0", justifyContent: "flex-start", borderRadius: 2, py: 1, "&:hover": { bgcolor: "#ff444422", color: "#ff6666" } }}>
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  // ── Quick Action Button ─────────────────────────────────────────────────────
  const QuickAction = ({ icon, label, color, onClick }) => (
    <Paper onClick={onClick} sx={{
      p: 2, borderRadius: 3, textAlign: "center", cursor: "pointer",
      border: `1px solid ${color}22`, transition: "all 0.2s",
      "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 24px ${color}33`, borderColor: color },
    }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1 }}>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ color: "#333", display: "block" }}>{label}</Typography>
    </Paper>
  );

  // ── Transaction Row ─────────────────────────────────────────────────────────
  const TxnRow = ({ txn }) => {
    const isIn = ["received", "deposit", "request_received"].includes(txn.type);
    const isOut = ["sent", "bill"].includes(txn.type);
    const icons = { deposit: "💰", sent: "📤", received: "📥", bill: "🧾", request: "📩", request_received: "📩" };
    return (
      <TableRow hover sx={{ "&:hover": { bgcolor: "#f5f0ff44" } }}>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: isIn ? "#e8f5e9" : isOut ? "#fce4ec" : "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {icons[txn.type] || "💳"}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {txn.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">{txn.date} · {txn.time}</Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip label={txn.category || txn.type} size="small"
            sx={{ fontSize: "0.65rem", bgcolor: "#f5f0ff", color: "#7c5cbf" }} />
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight={700}
            sx={{ color: isIn ? "#2e7d32" : isOut ? "#c62828" : "#555" }}>
            {isIn ? "+" : isOut ? "-" : ""}{fmt(txn.amount)}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Chip label={txn.status} size="small"
            sx={{ bgcolor: txn.status === "completed" ? "#e8f5e9" : "#fff8e1", color: txn.status === "completed" ? "#2e7d32" : "#f9a825", fontSize: "0.65rem" }} />
        </TableCell>
      </TableRow>
    );
  };

  // ── Render Tabs ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── DASHBOARD ──────────────────────────────────────────────────────────
      case "dashboard": return (
        <Box>
          {/* Balance Card */}
          <Paper sx={{ borderRadius: 4, background: getTierBg(userData?.accountType), p: 3, mb: 3, color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)" }} />
            <Box sx={{ position: "absolute", bottom: -40, right: 40, width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
            <Typography variant="overline" sx={{ opacity: 0.75, fontSize: "0.7rem", letterSpacing: 2 }}>
              AVAILABLE BALANCE
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ my: 0.5, letterSpacing: "-1px" }}>
              {fmt(userData?.balance || 0)}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>Account</Typography>
                <Typography variant="body2" fontWeight={600}>{userData?.accountNumber}</Typography>
              </Box>
              <Chip label={userData?.accountType} size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, backdropFilter: "blur(4px)" }} />
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Quick Actions</Typography>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {[
              { icon: <Send />, label: "Send Money", color: "#7c5cbf", action: () => { clearModal(); setSendModal(true); } },
              { icon: <Add />, label: "Deposit", color: "#4caf50", action: () => { clearModal(); setDepositModal(true); } },
              { icon: <RequestPage />, label: "Request", color: "#2196f3", action: () => { clearModal(); setRequestModal(true); } },
              { icon: <Receipt />, label: "Pay Bills", color: "#ff9800", action: () => { clearModal(); setBillModal(true); } },
            ].map((q) => (
              <Grid item xs={6} sm={3} key={q.label}>
                <QuickAction icon={q.icon} label={q.label} color={q.color} onClick={q.action} />
              </Grid>
            ))}
          </Grid>

          {/* Recent Transactions */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Recent Transactions</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f5f0ff" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#7c5cbf" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#7c5cbf" }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#7c5cbf" }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#7c5cbf" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...txns].reverse().slice(0, 5).map((t) => <TxnRow key={t.id} txn={t} />)}
                {txns.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>No transactions yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {txns.length > 5 && (
            <Button fullWidth onClick={() => setActiveTab("transactions")} sx={{ mt: 1, color: "#7c5cbf", fontWeight: 700 }}>
              View All Transactions →
            </Button>
          )}
        </Box>
      );

      // ── TRANSACTIONS ───────────────────────────────────────────────────────
      case "transactions": return (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Transaction History</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <TextField size="small" placeholder="Search transactions…" value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 180 }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select value={txnFilter} onChange={(e) => setTxnFilter(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="received">Received</MenuItem>
                <MenuItem value="deposit">Deposits</MenuItem>
                <MenuItem value="bill">Bills</MenuItem>
                <MenuItem value="request">Requests</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f0ff" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#7c5cbf" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#7c5cbf" }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#7c5cbf" }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "#7c5cbf" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTxns.map((t) => <TxnRow key={t.id} txn={t} />)}
                {filteredTxns.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5, color: "text.secondary" }}>No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      );

      // ── VIRTUAL CARD ───────────────────────────────────────────────────────
      case "card": {
        const card = userData?.issuedCard || {};
        return (
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Virtual Card</Typography>
            {/* Card Visual */}
            <Box sx={{
              background: getTierBg(userData?.accountType),
              borderRadius: 4, p: 3, mb: 3, color: "#fff", maxWidth: 400,
              boxShadow: "0 20px 60px rgba(124,92,191,0.3)", position: "relative", overflow: "hidden",
            }}>
              <Box sx={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.8, letterSpacing: 2 }}>QUINCORE BANK</Typography>
                <Typography variant="body2" fontWeight={700}>{card.network || "Mastercard"}</Typography>
              </Box>
              <Typography variant="h6" fontWeight={700} letterSpacing={3} sx={{ mb: 2, fontFamily: "monospace" }}>
                {showCardNumber
                  ? `${card.cardNumber?.replace(/\*/g, "8").slice(0, 4)} ${card.cardNumber?.replace(/\*/g, "8").slice(5, 9)} ${card.cardNumber?.replace(/\*/g, "8").slice(10, 14)} ${userData?.pin?.slice(-4) || "0000"}`
                  : card.cardNumber || "**** **** **** 0000"}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>CARDHOLDER</Typography>
                  <Typography variant="body2" fontWeight={700}>{card.cardHolder}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>EXPIRES</Typography>
                  <Typography variant="body2" fontWeight={700}>{card.expiry}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>CVV</Typography>
                  <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                    {showCvv ? card.cvv : "•••"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
              <Button variant="outlined" size="small" startIcon={showCardNumber ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowCardNumber((v) => !v)} sx={{ borderColor: "#7c5cbf", color: "#7c5cbf", borderRadius: 3 }}>
                {showCardNumber ? "Hide" : "Reveal"} Number
              </Button>
              <Button variant="outlined" size="small" startIcon={showCvv ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowCvv((v) => !v)} sx={{ borderColor: "#7c5cbf", color: "#7c5cbf", borderRadius: 3 }}>
                {showCvv ? "Hide" : "Show"} CVV
              </Button>
              <Button variant="outlined" size="small" startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                onClick={() => { navigator.clipboard.writeText(card.cardNumber || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                sx={{ borderColor: "#7c5cbf", color: "#7c5cbf", borderRadius: 3 }}>
                {copied ? "Copied!" : "Copy Number"}
              </Button>
            </Box>

            <Grid container spacing={2}>
              {[
                ["Card Limit", fmt(card.limit || 0)],
                ["Card Tier", userData?.accountType],
                ["Network", card.network || "Mastercard"],
                ["Status", "Active ✓"],
              ].map(([label, val]) => (
                <Grid item xs={6} key={label}>
                  <Paper sx={{ p: 2, borderRadius: 3, border: "1px solid #ede0ff" }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body1" fontWeight={700} sx={label === "Status" ? { color: "#2e7d32" } : undefined}>{val}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      }

      // ── ANALYTICS ──────────────────────────────────────────────────────────
      case "analytics": {
        const totalSpent = txns.filter((t) => ["sent", "bill"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
        const totalReceived = txns.filter((t) => ["received", "deposit"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
        const savingsRate = totalReceived > 0 ? Math.max(0, Math.round(((totalReceived - totalSpent) / totalReceived) * 100)) : 0;
        const creditScore = Math.min(850, 600 + Math.floor(userData?.balance / 100) + txns.filter((t) => t.status === "completed").length * 2);
        return (
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Analytics</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { label: "Total Spent", value: fmt(totalSpent), color: "#c62828", icon: <ArrowUpward /> },
                { label: "Total Received", value: fmt(totalReceived), color: "#2e7d32", icon: <ArrowDownward /> },
                { label: "Savings Rate", value: `${savingsRate}%`, color: "#7c5cbf", icon: <TrendingUp /> },
                { label: "Credit Score", value: String(creditScore), color: creditScore >= 750 ? "#2e7d32" : creditScore >= 650 ? "#f9a825" : "#c62828", icon: <BarChart /> },
              ].map((m) => (
                <Grid item xs={6} sm={3} key={m.label}>
                  <Paper sx={{ p: 2, borderRadius: 3, border: `1px solid ${m.color}22` }}>
                    <Box sx={{ color: m.color, mb: 0.5 }}>{m.icon}</Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: m.color }}>{m.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Spending Trend (6 months)</Typography>
                  <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Spending by Category</Typography>
                  <Doughnut data={doughnutData} options={{ responsive: true, cutout: "65%", plugins: { legend: { position: "bottom" } } }} />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      }

      // ── PROFILE ────────────────────────────────────────────────────────────
      case "profile": return (
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Profile</Typography>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: "#7c5cbf", fontSize: "1.5rem", fontWeight: 700 }}>
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{userData?.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">{userData?.email}</Typography>
                <Chip label={userData?.accountType} size="small" sx={{ bgcolor: getTierColor(userData?.accountType), color: "#fff", mt: 0.5, fontWeight: 700, fontSize: "0.65rem" }} />
              </Box>
            </Box>

            {editProfile ? (
              <Grid container spacing={2}>
                {[
                  ["First Name", "firstName"], ["Last Name", "lastName"],
                  ["Phone", "phone"], ["Address", "address"],
                ].map(([label, field]) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField fullWidth size="small" label={label} value={profileForm[field] || ""}
                      onChange={(e) => setProfileForm((p) => ({ ...p, [field]: e.target.value }))} />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={handleProfileSave} disabled={profileLoading} variant="contained"
                      sx={{ borderRadius: 3, bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" } }}>
                      {profileLoading ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
                    </Button>
                    <Button onClick={() => setEditProfile(false)} sx={{ color: "text.secondary" }}>Cancel</Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Box>
                <Grid container spacing={1.5}>
                  {[
                    ["Full Name", userData?.fullName],
                    ["Email", userData?.email],
                    ["Phone", userData?.phone],
                    ["Date of Birth", userData?.dateOfBirth],
                    ["Country", userData?.country],
                    ["Currency", `${userData?.currency} (${userData?.currencySymbol})`],
                    ["Address", userData?.address],
                    ["Account Number", userData?.accountNumber],
                    ["Member Since", userData?.createdAt?.toDate?.()?.toLocaleDateString() || "—"],
                  ].map(([label, val]) => (
                    <Grid item xs={12} sm={6} key={label}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-all" }}>{val || "—"}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Button onClick={() => { setEditProfile(true); setProfileForm({ firstName: userData?.firstName, lastName: userData?.lastName, phone: userData?.phone, address: userData?.address }); }}
                  variant="outlined" sx={{ mt: 2.5, borderRadius: 3, borderColor: "#7c5cbf", color: "#7c5cbf" }}>
                  Edit Profile
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      );

      default: return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f4ff" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box sx={{ width: 240, flexShrink: 0, position: "fixed", top: 0, left: 0, bottom: 0 }}>
          <SidebarContent />
        </Box>
      )}

      {/* Mobile Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}>
        <SidebarContent />
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, ml: isMobile ? 0 : "240px" }}>
        {/* Top Bar */}
        <Box sx={{ bgcolor: "#fff", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ede0ff", position: "sticky", top: 0, zIndex: 100 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} size="small">
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {userData?.firstName} 👋
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small"><Notifications sx={{ color: "#7c5cbf" }} /></IconButton>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "#7c5cbf", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
              onClick={() => setActiveTab("profile")}>
              {userData?.firstName?.[0]}{userData?.lastName?.[0]}
            </Avatar>
          </Box>
        </Box>

        {/* Page Content */}
        <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          {renderContent()}
        </Container>
      </Box>

      {/* ─── MODALS ─────────────────────────────────────────────────── */}

      {/* Send Money */}
      <ActionModal open={sendModal} onClose={() => { setSendModal(false); clearModal(); }}
        title="Send Money" onSubmit={handleSend} loading={actionLoading} submitLabel="Send">
        {actionSuccess ? <Alert severity="success" sx={{ borderRadius: 2 }}>{actionSuccess}</Alert> : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 2 }}>{actionError}</Alert>}
            <TextField fullWidth label="Recipient Email" type="email"
              value={sendForm.recipientEmail} onChange={(e) => setSendForm((p) => ({ ...p, recipientEmail: e.target.value }))} />
            <TextField fullWidth label={`Amount (${userData?.currencySymbol})`} type="number"
              value={sendForm.amount} onChange={(e) => setSendForm((p) => ({ ...p, amount: e.target.value }))}
              helperText={`Available: ${fmt(userData?.balance || 0)}`} />
            <TextField fullWidth label="Purpose / Note (optional)"
              value={sendForm.purpose} onChange={(e) => setSendForm((p) => ({ ...p, purpose: e.target.value }))} />
          </Box>
        )}
      </ActionModal>

      {/* Deposit */}
      <ActionModal open={depositModal} onClose={() => { setDepositModal(false); clearModal(); }}
        title="Deposit Money" onSubmit={handleDeposit} loading={actionLoading} submitLabel="Deposit">
        {actionSuccess ? <Alert severity="success" sx={{ borderRadius: 2 }}>{actionSuccess}</Alert> : (
          <Box sx={{ pt: 1 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{actionError}</Alert>}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              {[100, 500, 1000, 2500, 5000].map((amt) => (
                <Chip key={amt} label={`${userData?.currencySymbol}${amt.toLocaleString()}`} clickable
                  onClick={() => setDepositAmount(String(amt))}
                  sx={{ bgcolor: depositAmount === String(amt) ? "#7c5cbf" : "#f5f0ff", color: depositAmount === String(amt) ? "#fff" : "#7c5cbf", fontWeight: 700 }} />
              ))}
            </Box>
            <TextField fullWidth label={`Amount (${userData?.currencySymbol})`} type="number"
              value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
              helperText="Minimum deposit: 10" />
          </Box>
        )}
      </ActionModal>

      {/* Request Money */}
      <ActionModal open={requestModal} onClose={() => { setRequestModal(false); clearModal(); }}
        title="Request Money" onSubmit={handleRequest} loading={actionLoading} submitLabel="Send Request">
        {actionSuccess ? <Alert severity="success" sx={{ borderRadius: 2 }}>{actionSuccess}</Alert> : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 2 }}>{actionError}</Alert>}
            <TextField fullWidth label="Request From (Email)" type="email"
              value={requestForm.recipientEmail} onChange={(e) => setRequestForm((p) => ({ ...p, recipientEmail: e.target.value }))} />
            <TextField fullWidth label={`Amount (${userData?.currencySymbol})`} type="number"
              value={requestForm.amount} onChange={(e) => setRequestForm((p) => ({ ...p, amount: e.target.value }))} />
            <TextField fullWidth label="Note (optional)" multiline rows={2}
              value={requestForm.note} onChange={(e) => setRequestForm((p) => ({ ...p, note: e.target.value }))} />
          </Box>
        )}
      </ActionModal>

      {/* Pay Bills */}
      <ActionModal open={billModal} onClose={() => { setBillModal(false); clearModal(); }}
        title="Pay Bill" onSubmit={handleBill} loading={actionLoading} submitLabel="Pay Now">
        {actionSuccess ? <Alert severity="success" sx={{ borderRadius: 2 }}>{actionSuccess}</Alert> : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {actionError && <Alert severity="error" sx={{ borderRadius: 2 }}>{actionError}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Bill Type</InputLabel>
              <Select value={billForm.billType} onChange={(e) => setBillForm((p) => ({ ...p, billType: e.target.value }))} label="Bill Type">
                {BILL_TYPES.map((b) => <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={`Amount (${userData?.currencySymbol})`} type="number"
              value={billForm.amount} onChange={(e) => setBillForm((p) => ({ ...p, amount: e.target.value }))}
              helperText={`Available: ${fmt(userData?.balance || 0)}`} />
            <TextField fullWidth label="Account / Reference Number (optional)"
              value={billForm.accountRef} onChange={(e) => setBillForm((p) => ({ ...p, accountRef: e.target.value }))} />
          </Box>
        )}
      </ActionModal>
    </Box>
  );
}
