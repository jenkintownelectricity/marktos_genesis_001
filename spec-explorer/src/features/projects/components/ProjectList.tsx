import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Project } from '@/data/db/indexedDB';
import { useTenantContext } from '@/app/providers/TenantProvider';
import { Modal } from '@/shared/components/Modal';
import {
  PlusIcon,
  FolderIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export function ProjectList() {
  const { current: tenant } = useTenantContext();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const tenantId = tenant?.id || 'local';

  const projects = useLiveQuery(
    () => db.getProjectsByTenant(tenantId),
    [tenantId],
    []
  );

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    const project: Project = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      name: newProjectName,
      description: newProjectDesc,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.projects.add(project);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProject(false);
  };

  const deleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await db.projects.delete(id);
      await db.project_items.where('project_id').equals(id).delete();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize specifications into project collections
          </p>
        </div>
        <button onClick={() => setShowNewProject(true)} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first project to start organizing specifications
          </p>
          <button onClick={() => setShowNewProject(true)} className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FolderIcon className="h-8 w-8 text-primary-500" />
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                Created {format(new Date(project.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="input-field"
              placeholder="e.g., Building A Fire Protection"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Brief description of the project..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowNewProject(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={createProject}
              disabled={!newProjectName.trim()}
              className="btn-primary"
            >
              Create Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
