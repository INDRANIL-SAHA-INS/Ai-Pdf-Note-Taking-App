"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { 
  Users, FileText, Youtube, UserPlus, Settings, Loader2, 
  ChevronLeft, MoreVertical, Trash, Edit, Share, Download
} from 'lucide-react';
import Link from 'next/link';
import UplodPdfDialog from '../../_components/UplodPdfDialogue';
import UploadYoutubeDialoguebox from '../../_components/uploadYoutbeDialoguebox';

export default function WorkspaceDetailsPage() {
  const params = useParams();
  const workspaceId = params.workspace_id;
  const { user } = useUser();
  const [userEmail, setUserEmail] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setUserEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  // Get workspace details
  const workspace = useQuery(api.workspace.getWorkspaceById, {
    workspace_id: workspaceId
  });

  // Get workspace members
  const members = useQuery(api.workspace.getWorkspaceMembers, {
    workspace_id: workspaceId
  });

  // Get workspace files
  const files = useQuery(
    api.PdfStorage.getPdfFilesByWorkspace,
    { workspace_id: workspaceId }
  );

  // Determine if current user is admin
  const isAdmin = React.useMemo(() => {
    if (!workspace || !members || !userEmail) return false;
    
    // Check if user is the owner
    if (workspace.email === userEmail) return true;
    
    // Check if user is an admin member
    const userMembership = members.find(m => m.user_email === userEmail);
    return userMembership?.role === 'admin';
  }, [workspace, members, userEmail]);

  // Add member mutation
  const addMember = useMutation(api.workspace.addMemberToWorkspace);
  const removeMember = useMutation(api.workspace.removeMemberFromWorkspace);
  const removePdf = useMutation(api.PdfStorage.removePdfFile);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    
    setIsAddingMember(true);
    try {
      await addMember({
        workspace_id: workspaceId,
        user_email: memberEmail,
        role: memberRole
      });
      setMemberEmail('');
      setMemberRole('member');
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member: ' + error.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (email) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await removeMember({
        workspace_id: workspaceId,
        user_email: email
      });
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member: ' + error.message);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await removePdf({
        fileId: fileId,
        user_email: userEmail
      });
      // No need to refresh the page, the query will automatically update
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!workspace) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="mb-6">
        <Link href="/dashboard/workspace" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Workspaces
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{workspace.workspace_name}</h1>
          {isAdmin && (
            <button className="p-2 rounded-md hover:bg-gray-300">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
        <p className="text-gray-600">Created by {workspace.email}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-4 px-1 ${
              activeTab === 'files'
                ? 'border-b-2 border-black text-black font-medium'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-black mr-2" />
              Files
            </div>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 px-1 ${
              activeTab === 'members'
                ? 'border-b-2 border-black text-black font-medium'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Members
            </div>
          </button>
        </div>
      </div>

      {/* Action buttons - only for admins */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          {activeTab === 'files' ? (
            <>
              <UplodPdfDialog workspaceId={workspaceId}>
                <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 hover:text-black transition-colors flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Upload PDF
                </button>
              </UplodPdfDialog>
              <UploadYoutubeDialoguebox workspaceId={workspaceId}>
                <button className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 hover:text-black transition-colors flex items-center">
                  <Youtube className="h-5 w-5 text-black mr-2" />
                  Add YouTube Video
                </button>
              </UploadYoutubeDialoguebox>
            </>
          ) : (
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 hover:text-black transition-colors flex items-center"
            >
              <UserPlus className="h-5 w-5 text-black mr-2" />
              Add Member
            </button>
          )}
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'files' ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Workspace Files</h2>
          {!files ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No files in this workspace</h3>
              {isAdmin ? (
                <p className="text-gray-600">Upload a PDF or add a YouTube video to get started</p>
              ) : (
                <p className="text-gray-600">No files have been added to this workspace yet</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {files.map((file) => (
                <div key={file._id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/workspace/${file.fileId}`} className="block p-4">
                    <div className="flex justify-center mb-3">
                      <FileText className="h-12 w-12 text-black" />
                    </div>
                    <h3 className="font-medium text-center truncate mb-1">{file.fileName}</h3>
                    <p className="text-xs text-gray-500 text-center">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                  {isAdmin && (
                    <div className="border-t px-4 py-2 bg-gray-50 flex justify-end">
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <Share className="h-4 w-4 text-black" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700 ml-2">
                        <Download className="h-4 w-4 text-black" />
                      </button>
                      <button 
                        className="p-1 text-red-500 hover:text-red-700 ml-2"
                        onClick={() => handleDeleteFile(file.fileId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4 text-black" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Workspace Members</h2>
          {!members ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    {isAdmin && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {member.user_email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.added_at).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Prevent removing owner */}
                          {workspace.email !== member.user_email ? (
                            <button
                              onClick={() => handleRemoveMember(member.user_email)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          ) : (
                            <span className="text-gray-400">Owner</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Member to Workspace</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="member-email"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="member-role"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember || !memberEmail.trim()}
                  className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 disabled:bg-gray-300"
                >
                  {isAddingMember ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
