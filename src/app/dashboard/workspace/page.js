"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Plus, Users, FolderPlus, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';

const WorkspacePage = () => {
  const { user } = useUser();
  const [userEmail, setUserEmail] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setUserEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);
  //get user  from users table using email
  const get_user_by_email=useQuery(api.user.getUserByEmail, { email: userEmail });

  // Get workspaces where user is an owner
  const ownedWorkspaces = useQuery(
    api.workspace.getWorkspacesByOwnerEmail,
    userEmail ? { email: userEmail } : "skip"
  );
  
  // Get workspaces where user is a member
  const memberWorkspaces = useQuery(
    api.workspace.getWorkspacesByMemberEmail,
    userEmail ? { email: userEmail } : "skip"
  );

  // Combine and deduplicate workspaces
  const allWorkspaces = React.useMemo(() => {
    if (!ownedWorkspaces || !memberWorkspaces) return [];
    
    // Convert to a Map to deduplicate by ID
    const workspaceMap = new Map();
    
    // Add owned workspaces first
    ownedWorkspaces.forEach(workspace => {
      workspaceMap.set(workspace._id, { ...workspace, role: 'admin', isOwner: true });
    });
    
    // Add member workspaces (will overwrite if already an owner)
    memberWorkspaces.forEach(workspace => {
      if (!workspaceMap.has(workspace._id)) {
        workspaceMap.set(workspace._id, { ...workspace, isOwner: false });
      }
    });
    
    return Array.from(workspaceMap.values());
  }, [ownedWorkspaces, memberWorkspaces]);

  // Create workspace mutation
  const createWorkspace = useMutation(api.workspace.createWorkspace);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    
    setIsCreating(true);
    try {
      // Make sure we have the user from our database
      if (!get_user_by_email) {
        throw new Error('User not found in database');
      }
      
      await createWorkspace({
        workspace_name: workspaceName,
        owner_id: get_user_by_email._id, // Use the Convex user ID from our database
        email: userEmail,
      });
      setWorkspaceName('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Error creating workspace: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Workspace
        </button>
      </div>

      {/* Workspaces Grid */}
      {!ownedWorkspaces || !memberWorkspaces ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : allWorkspaces.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FolderPlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">No workspaces yet</h3>
          <p className="text-gray-600 mb-6">Create your first workspace to collaborate with your team</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-300 transition-colors"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allWorkspaces.map((workspace) => (
            <Link 
              href={`/dashboard/workspace/${workspace._id}`} 
              key={workspace._id}
              className="no-underline"
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <FolderPlus className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workspace.role === 'admin' || workspace.isOwner 
                        ? 'bg-blue-100 text-black' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {workspace.isOwner ? 'Owner' : workspace.role}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{workspace.workspace_name}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Members: {workspace.memberCount || '—'}</span>
                </div>
                <div className="text-xs text-gray-500 mt-auto">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team Project"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !workspaceName.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
