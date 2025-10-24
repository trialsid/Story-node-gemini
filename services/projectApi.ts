import { ProjectDetail, ProjectMetadata, ProjectState } from '../types';

type CreateProjectRequest = {
  name: string;
  state?: ProjectState | null;
};

type UpdateProjectRequest = {
  name?: string;
  state?: ProjectState | null;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : undefined;
};

export const fetchProjects = async (): Promise<ProjectMetadata[]> => {
  const data = await handleResponse(await fetch('/api/projects')) as { projects?: ProjectMetadata[] } | undefined;
  return data?.projects ?? [];
};

export const fetchProject = async (id: string): Promise<ProjectDetail> => {
  const data = await handleResponse(await fetch(`/api/projects/${id}`)) as { project: ProjectDetail };
  return data.project;
};

export const createProject = async (payload: CreateProjectRequest): Promise<ProjectMetadata> => {
  const data = await handleResponse(await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })) as { project: { metadata: ProjectMetadata } };
  return data.project.metadata;
};

export const updateProject = async (id: string, payload: UpdateProjectRequest): Promise<ProjectMetadata> => {
  const data = await handleResponse(await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })) as { project: { metadata: ProjectMetadata } };
  return data.project.metadata;
};

export const deleteProject = async (id: string): Promise<void> => {
  await handleResponse(await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  }));
};
