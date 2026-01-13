import * as React from 'react';

import DocsLibrary from '../../components/DocService/DocsLibrary';
import FileUpload from '../../components/Modals/FileUpload';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [currentFolderPath, setCurrentFolderPath] = React.useState<string>(''); // Add this state

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    setCurrentView(view);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFolderChange = React.useCallback((folderName: string, folderUrl: string) => {
    setCurrentFolderPath(folderUrl);
    console.log('Folder changed:', folderName, folderUrl);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <DocsLibrary
        currentView={currentView}
        searchTerm={searchTerm}
        onFolderChange={handleFolderChange}
        onViewChange={handleViewChange}
        onSearch={handleSearch}
        onAddNew={handleOpenModal}
      />

      <FileUpload
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        currentFolderPath={currentFolderPath}
      />
    </div>
  );
}

export default Home;