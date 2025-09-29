# Project Saving Feature - Implementation TODO

## Overview
Implementation of project saving/loading with project-specific galleries using **existing Express.js backend** with organized file structure and meaningful timestamps.

**Architecture**: Extend existing Express.js server to handle projects alongside gallery items, with organized folder structure for easy file browsing.

---

## Phase 1: Backend Foundation - Extend Express Server
*Goal: Add project storage endpoints to existing gallery server*

### 1.1 Project API Endpoints
- [ ] Add project endpoints to `server/index.js`
  - [ ] Add `projectsFile` constant: `path.join(generatedDir, 'projects.json')`
  - [ ] Add `readProjectsMetadata()` function (similar to `readMetadata()`)
  - [ ] Add `writeProjectsMetadata()` function (similar to `writeMetadata()`)
  - [ ] Add `ensureProjectsDir()` function to create `generated/projects/`
- [ ] Implement `GET /api/projects` endpoint
  - [ ] Return list of all projects with metadata
  - [ ] Include project ID, name, created/modified dates
- [ ] Implement `POST /api/projects` endpoint
  - [ ] Accept project data in request body
  - [ ] Generate project ID and timestamps
  - [ ] Save to `projects.json` and individual project file
- [ ] Test: Can create and retrieve projects via API calls

### 1.2 Project File Management
- [ ] Implement `PUT /api/projects/:id` endpoint for updates
- [ ] Implement `DELETE /api/projects/:id` endpoint
  - [ ] Remove from `projects.json`
  - [ ] Delete project folder and all media
  - [ ] Clean up orphaned gallery items
- [ ] Add project folder creation in `generated/projects/{projectId}/`
- [ ] Add static serving for project folders: `app.use('/generated', express.static(generatedDir))`
- [ ] Test: Full CRUD operations work correctly

### 1.3 Enhanced File Organization
- [ ] Create folder structure utility functions
  - [ ] `getProjectMediaFolder(projectId, nodeType)` - returns folder path
  - [ ] `generateMeaningfulFilename(nodeType, prompt, extension)` - timestamp + readable name
  - [ ] `ensureProjectFolders(projectId)` - creates characters/, scenes/, videos/, stories/
- [ ] Update file naming to: `YYYY-MM-DD_HH-mm-ss_meaningful-name.ext`
- [ ] Test: Files are created with correct names in organized folders

---

## Phase 2: Frontend API Integration
*Goal: Create frontend services to communicate with project API*

### 2.1 Project API Service
- [ ] Create `services/projectApi.ts`
  - [ ] `fetchProjects(): Promise<ProjectMetadata[]>` function
  - [ ] `createProject(projectData): Promise<Project>` function
  - [ ] `updateProject(id, projectData): Promise<Project>` function
  - [ ] `deleteProject(id): Promise<void>` function
  - [ ] Add error handling similar to `galleryApi.ts`
- [ ] Test: API service functions work with backend endpoints

### 2.2 Project Data Types
- [ ] Create `types/project.ts`
  - [ ] `ProjectMetadata` interface (id, name, created, modified, description)
  - [ ] `ProjectFile` interface (metadata + canvasState + settings)
  - [ ] `ProjectSettings` interface (theme, viewState, etc.)
- [ ] Update main `types.ts` to export project types
- [ ] Test: Types compile without errors

### 2.3 Enhanced Gallery API for Projects
- [ ] Update `services/galleryApi.ts`
  - [ ] Add `projectId` parameter to `createGalleryItem()`
  - [ ] Add `fetchProjectGalleryItems(projectId)` function
  - [ ] Update backend to filter gallery by projectId
- [ ] Update `server/index.js` gallery endpoints
  - [ ] Modify POST `/api/gallery` to accept and store `projectId`
  - [ ] Add GET `/api/gallery?projectId=xxx` filtering
- [ ] Test: Gallery items can be associated with projects

---

## Phase 3: Project State Management
*Goal: Add project context and state management to React app*

### 3.1 Project Context
- [ ] Create `contexts/ProjectContext.tsx`
  - [ ] `currentProject` state (ProjectFile | null)
  - [ ] `projects` state (ProjectMetadata[])
  - [ ] `isLoading` and `error` states
  - [ ] `unsavedChanges` state tracking
- [ ] Create context provider functions
  - [ ] `loadProjects()` - fetch all projects from API
  - [ ] `createNewProject(name, description?)` - create and switch to new project
  - [ ] `switchToProject(projectId)` - load different project
  - [ ] `updateCurrentProject(updates)` - update current project data
- [ ] Integrate ProjectContext into `App.tsx`
- [ ] Test: Can manage projects in React state

### 3.2 Project Hook
- [ ] Create `hooks/useProject.ts`
  - [ ] `useProject()` hook that returns project context
  - [ ] `useCurrentProject()` hook for current project operations
  - [ ] `useProjectList()` hook for project management
- [ ] Add project validation utilities
- [ ] Test: Hooks provide clean API for components

### 3.3 Canvas Integration with Projects
- [ ] Update canvas state to be project-aware
  - [ ] Modify `canvasState` to load from current project
  - [ ] Ensure node/connection updates save to current project
  - [ ] Update node data to include `galleryItemId` references
- [ ] Test: Canvas operations are properly saved to projects

---

## Phase 4: Media Integration - Organized File Storage
*Goal: Update media generation to use organized project folders*

### 4.1 Enhanced Media Generation
- [ ] Update `handleGenerateCharacter()` in `App.tsx`
  - [ ] Pass current `projectId` to gallery creation
  - [ ] Use organized folder path: `projects/{projectId}/characters/`
  - [ ] Generate meaningful filename from character description
  - [ ] Store both `imageUrl` and `galleryItemId` in node data
- [ ] Update `handleGenerateImages()` in `App.tsx`
  - [ ] Use `projects/{projectId}/scenes/` folder
  - [ ] Generate filename from image prompt
- [ ] Update `handleGenerateVideo()` in `App.tsx`
  - [ ] Use `projects/{projectId}/videos/` folder
  - [ ] Generate filename from video prompt
- [ ] Test: Generated media files appear in organized project folders

### 4.2 Text Generation Storage
- [ ] Update `handleGenerateText()` and `handleGenerateStory()` functions
  - [ ] Save generated text to `projects/{projectId}/stories/` folder
  - [ ] Create `.txt` files with timestamped meaningful names
  - [ ] Update node data to reference text files
- [ ] Add text file serving to backend
- [ ] Test: Text generations are saved and retrievable

### 4.3 Gallery Panel Project Filtering
- [ ] Update `components/GalleryPanel.tsx`
  - [ ] Filter gallery items by current project ID
  - [ ] Add project name indicator in gallery header
  - [ ] Add "Show All Projects" toggle for migration/cleanup
- [ ] Update gallery item display to show organized folder structure
- [ ] Test: Gallery shows only current project's media

---

## Phase 5: Project Management UI
*Goal: Add comprehensive project management interface*

### 5.1 Project Toolbar Integration
- [ ] Update `components/Toolbar.tsx`
  - [ ] Add current project name display (editable)
  - [ ] Add project dropdown menu button
  - [ ] Style to integrate with existing toolbar design
- [ ] Add unsaved changes indicator (asterisk or dot)
- [ ] Test: Toolbar shows current project and unsaved state

### 5.2 Project Menu Component
- [ ] Create `components/ProjectMenu.tsx`
  - [ ] "New Project" option with name input
  - [ ] "Switch Project" submenu with project list
  - [ ] "Save Project" option (manual save)
  - [ ] "Duplicate Project" option
  - [ ] "Delete Project" option with confirmation
  - [ ] "Project Settings" option (rename, description)
- [ ] Add keyboard shortcuts (Ctrl+N, Ctrl+S)
- [ ] Test: All project operations work from UI

### 5.3 Project Creation Modal
- [ ] Create `components/NewProjectModal.tsx`
  - [ ] Project name input (required)
  - [ ] Optional description textarea
  - [ ] Template selection: Empty, Copy Current Canvas
  - [ ] Create button with loading state
- [ ] Add project name validation (unique names, length limits)
- [ ] Test: Can create projects with various options

---

## Phase 6: Auto-Save and Project Switching
*Goal: Implement seamless auto-save and project switching*

### 6.1 Auto-Save System
- [ ] Create `hooks/useAutoSave.ts`
  - [ ] Debounced save after canvas changes (2 seconds)
  - [ ] Periodic save every 30 seconds if unsaved changes
  - [ ] Save on browser beforeunload event
  - [ ] Handle save errors gracefully with retry logic
- [ ] Integrate auto-save into main App component
- [ ] Add visual feedback for save status (saving/saved/error)
- [ ] Test: Auto-save works reliably without interfering with user workflow

### 6.2 Project Switching Flow
- [ ] Add confirmation dialog for unsaved changes
- [ ] Create loading states during project switches
- [ ] Implement project switch with gallery refresh
- [ ] Add recent projects list (last 10 accessed)
- [ ] Test: Project switching is smooth and data is preserved

### 6.3 Project Validation and Recovery
- [ ] Add project file validation on load
- [ ] Implement recovery for corrupted project files
- [ ] Add automatic backup before major operations
- [ ] Handle missing gallery items gracefully
- [ ] Test: App handles various corruption/error scenarios

---

## Phase 7: Import/Export and Sharing
*Goal: Add project portability and sharing capabilities*

### 7.1 Project Export
- [ ] Create `utils/projectExport.ts`
  - [ ] `exportProject(projectId)` - create complete project JSON
  - [ ] Include all project data and gallery references
  - [ ] Add export metadata (version, export date, app version)
- [ ] Add "Export Project" to project menu
- [ ] Create export progress indicator for large projects
- [ ] Test: Exported projects contain complete data

### 7.2 Project Import
- [ ] Create `utils/projectImport.ts`
  - [ ] `importProject(projectFile)` - validate and import project
  - [ ] Handle version compatibility
  - [ ] Generate new project ID on import (avoid conflicts)
  - [ ] Validate gallery references and handle missing media
- [ ] Add "Import Project" to project menu with file picker
- [ ] Add import validation and error reporting
- [ ] Test: Can import exported projects successfully

### 7.3 Media Bundling (Future Enhancement)
- [ ] Design ZIP export option including media files
- [ ] Plan media file restoration on import
- [ ] Consider media file conflict resolution
- [ ] Document for future implementation

---

## Phase 8: Migration and Polish
*Goal: Handle existing user data and add final polish*

### 8.1 Existing Data Migration
- [ ] Create migration utility for existing users
  - [ ] Detect existing canvas state and gallery items
  - [ ] Create "Default Project" from current state
  - [ ] Assign existing gallery items to default project
  - [ ] Preserve all existing functionality
- [ ] Add migration prompt on first launch with new system
- [ ] Create backup of existing data before migration
- [ ] Test: Migration preserves all existing user work

### 8.2 File Organization Migration
- [ ] Create utility to reorganize existing gallery files
  - [ ] Move files to organized project folders
  - [ ] Rename files with meaningful timestamps
  - [ ] Update gallery.json with new file paths
  - [ ] Preserve all existing references
- [ ] Add optional reorganization tool in settings
- [ ] Test: File reorganization works without breaking references

### 8.3 Performance Optimization
- [ ] Optimize project loading for large projects
- [ ] Add pagination for project lists
- [ ] Implement lazy loading for gallery items
- [ ] Add storage usage monitoring and cleanup tools
- [ ] Test: App remains responsive with many projects

---

## Phase 9: Error Handling and Edge Cases
*Goal: Make the system robust and user-friendly*

### 9.1 Comprehensive Error Handling
- [ ] Add error boundaries for project operations
- [ ] Implement graceful degradation for API failures
- [ ] Add user-friendly error messages for all failure modes
- [ ] Create error reporting and logging system
- [ ] Test: All error scenarios are handled gracefully

### 9.2 Storage Management
- [ ] Add disk space monitoring
- [ ] Implement cleanup tools for orphaned files
- [ ] Add project size calculation and display
- [ ] Create storage optimization recommendations
- [ ] Test: Storage management tools work correctly

### 9.3 Final Polish
- [ ] Add tooltips and help text for project features
- [ ] Improve keyboard navigation and shortcuts
- [ ] Add confirmation dialogs for destructive operations
- [ ] Optimize loading states and animations
- [ ] Test: User experience is smooth and intuitive

---

## Testing Strategy

### Unit Tests
- [ ] Test project API endpoints
- [ ] Test project utilities and validation
- [ ] Test file organization functions
- [ ] Test import/export functionality

### Integration Tests
- [ ] Test complete project workflows (create, edit, save, switch)
- [ ] Test gallery integration with projects
- [ ] Test auto-save and recovery scenarios
- [ ] Test migration from existing data

### User Acceptance Tests
- [ ] Test project creation and management flows
- [ ] Test cross-device workflow (save on one machine, load on another)
- [ ] Test file organization and browsing
- [ ] Test import/export workflows

---

## Success Criteria

### Functional Requirements
- [ ] Can create, name, and manage unlimited projects
- [ ] Projects auto-save every 30 seconds without user intervention
- [ ] Gallery is project-specific with organized folder structure
- [ ] Generated files have meaningful names with timestamps
- [ ] Can export/import projects as portable JSON files
- [ ] Existing users migrate seamlessly with no data loss
- [ ] Works across multiple machines/browsers accessing same server

### Non-Functional Requirements
- [ ] App remains responsive with 100+ projects
- [ ] Project switching takes less than 2 seconds
- [ ] Auto-save doesn't interfere with user workflow
- [ ] File organization makes manual browsing easy
- [ ] Error messages are clear and actionable

### File Organization Success
- [ ] Can browse `generated/projects/{project-name}/characters/` to see all character art
- [ ] File names are meaningful: `2024-12-29_14-30-22_brave-knight-with-scar.jpg`
- [ ] Multiple generations are clearly timestamped and trackable
- [ ] Easy to backup/sync entire `generated/` folder

---

## Notes

### Development Tips
- Commit after each major checkbox completion
- Test thoroughly at each phase before proceeding
- Maintain backward compatibility throughout
- Use feature flags for easy rollback if needed

### Deployment Notes
- Ensure `generated/projects/` directory permissions
- Update .gitignore to exclude large media files if needed
- Document server setup for multi-machine access

### Future Enhancements (Post-MVP)
- Cloud storage integration (AWS S3, Google Drive)
- Real-time collaboration features
- Project version history and branching
- Advanced search and filtering
- Project analytics and usage stats