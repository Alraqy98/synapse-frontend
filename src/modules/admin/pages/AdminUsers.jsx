// src/modules/admin/pages/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminUsers } from "../apiAdmin";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersData = await getAdminUsers();
        setUsers(usersData);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Users</h1>
          <p className="text-sm text-muted">Registered users in the system</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">Loading users…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted">No users found</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-[#1a1d24] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      University
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {user.full_name || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {user.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {user.university || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {user.student_year || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {user.country || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Admin
                          </span>
                        ) : (
                          <span className="text-sm text-muted">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
