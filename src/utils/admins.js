// Branch admins — to add Admin 5, copy one entry below, change the values,
// and generate matching invite codes (seed-adminN.html). Nothing else to edit.
export const BRANCH_ADMINS = [
  {
    role: "admin2", email: "Admin2quincorebankbranch@gmail.com", password: "ADMIN22026",
    prefix: "QCB2-", collection: "invite_codes_admin2",
    badge: "🏢 Branch 2", badgeClass: "bg-blue-100 text-blue-700",
    header: "🏢 Branch Admin — QCB2 Users Only",
  },
  {
    role: "admin3", email: "Admin3quincorebankbranch@gmail.com", password: "ADMIN32026",
    prefix: "QCB3-", collection: "invite_codes_admin3",
    badge: "🏬 Branch 3", badgeClass: "bg-purple-100 text-purple-700",
    header: "🏬 Branch Admin — QCB3 Users Only",
  },
  {
    role: "admin4", email: "Admin4quincorebankbranch@gmail.com", password: "ADMIN42026",
    prefix: "QCB4-", collection: "invite_codes_admin4",
    badge: "🏛️ Branch 4", badgeClass: "bg-emerald-100 text-emerald-700",
    header: "🏛️ Branch Admin — QCB4 Users Only",
  },
];

export const MASTER_BADGE = "👑 Master";
export const MASTER_HEADER = "👑 Master Admin — All Users";

export const findBranchByLogin = (email, password) =>
  BRANCH_ADMINS.find(a => a.email === email && a.password === password);
export const findBranchByRole = (role) => BRANCH_ADMINS.find(a => a.role === role);
export const findBranchByCode = (code) => BRANCH_ADMINS.find(a => code.startsWith(a.prefix));
export const isBranchRole = (role) => !!findBranchByRole(role);
export const codesCollectionFor = (role) => findBranchByRole(role)?.collection || "invite_codes";