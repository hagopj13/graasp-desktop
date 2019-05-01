const {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Menu,
  dialog,
  // eslint-disable-next-line import/no-extraneous-dependencies
} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const isOnline = require('is-online');
const electronDl = require('electron-dl');
// const fse = require('fs-extra');
// const extract = require('extract-zip');
// const archiver = require('archiver');
// const { ncp } = require('ncp');
const { autoUpdater } = require('electron-updater');
const Sentry = require('@sentry/electron');
const {
  // DELETE_SPACE_CHANNEL,
  // DELETED_SPACE_CHANNEL,
  // EXPORT_SPACE_CHANNEL,
  // EXPORTED_SPACE_CHANNEL,
  // LOAD_SPACE_CHANNEL,
  // LOADED_SPACE_CHANNEL,
  GET_SPACE_CHANNEL,
  MESSAGE_DIALOG_RESPOND_CHANNEL,
  GET_SPACES_CHANNEL,
  SAVE_DIALOG_PATH_SELECTED_CHANNEL,
  SHOW_MESSAGE_DIALOG_CHANNEL,
  SHOW_SAVE_DIALOG_CHANNEL,
  SHOW_OPEN_DIALOG_CHANNEL,
  OPEN_DIALOG_PATHS_SELECTED_CHANNEL,
  SAVE_SPACE_CHANNEL,
} = require('../src/config/channels');
const { getExtension, isDownloadable, generateHash } = require('./utilities');
const {
  ensureDatabaseExists,
  bootstrapDatabase,
  SPACES_COLLECTION,
} = require('./db');
const {
  ERROR_SPACE_ALREADY_AVAILABLE,
  ERROR_DOWNLOADING_FILE,
} = require('../src/config/errors');
const logger = require('./logger');

const VAR_FOLDER = `${app.getPath('userData')}/var`;
const DATABASE_PATH = `${VAR_FOLDER}/db.json`;

const isFileAvailable = filePath =>
  new Promise(resolve =>
    fs.access(filePath, fs.constants.F_OK, err => resolve(!err))
  );

const { download } = electronDl;
let mainWindow;

// set up sentry
const { SENTRY_DSN } = process.env;
Sentry.init({ dsn: SENTRY_DSN });

const createWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#F7F7F7',
    minWidth: 880,
    show: false,
    movable: true,
    webPreferences: {
      nodeIntegration: false,
      preload: `${__dirname}/preload.js`,
      webSecurity: false,
    },
    height: 860,
    width: 1280,
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
      // eslint-disable-next-line global-require
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => {
        logger.info(`added extension: ${name}`);
      })
      .catch(err => {
        logger.error(err);
      });

    installExtension(REDUX_DEVTOOLS)
      .then(name => {
        logger.info(`added extension: ${name}`);
      })
      .catch(err => {
        logger.error(err);
      });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    ipcMain.on('open-external-window', (event, arg) => {
      shell.openExternal(arg);
    });
  });
};

// const handleLoad = () => {
//   logger.info('load');
// };

const generateMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        // {
        //   label: 'Load Space',
        //   click() {
        //     handleLoad();
        //   },
        // },
        {
          label: 'About',
          role: 'about',
        },
        {
          label: 'Quit',
          role: 'quit',
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      role: 'help',
      submenu: [
        {
          click() {
            // eslint-disable-next-line
            require('electron').shell.openExternal(
              'https://github.com/react-epfl/graasp-desktop/blob/master/README.md'
            );
          },
          label: 'Learn More',
        },
        {
          click() {
            // eslint-disable-next-line
            require('electron').shell.openExternal(
              'https://github.com/react-epfl/graasp-desktop/issues'
            );
          },
          label: 'File Issue on GitHub',
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.on('ready', async () => {
  // updater
  autoUpdater.logger = logger;
  autoUpdater.checkForUpdatesAndNotify();

  await ensureDatabaseExists(DATABASE_PATH);
  const db = bootstrapDatabase(DATABASE_PATH);

  createWindow();
  generateMenu();

  // called when saving a space
  ipcMain.on(SAVE_SPACE_CHANNEL, async (event, { space }) => {
    // make a working copy of the space to save
    const spaceToSave = { ...space };
    try {
      // get handle to spaces collection
      const spaces = db.get(SPACES_COLLECTION);
      const { id } = space;
      const existingSpace = spaces.find({ id }).value();

      if (existingSpace) {
        return mainWindow.webContents.send(
          SAVE_SPACE_CHANNEL,
          ERROR_SPACE_ALREADY_AVAILABLE
        );
      }

      const { phases } = spaceToSave;
      // eslint-disable-next-line no-restricted-syntax
      for (const phase of phases) {
        const { items = [] } = phase;
        for (let i = 0; i < items.length; i += 1) {
          const resource = items[i];
          if (resource && isDownloadable(resource)) {
            const { url } = resource;

            // generate hash and get extension to save file
            const hash = generateHash(resource);
            const ext = getExtension(resource);
            const fileName = `${hash}.${ext}`;
            const filePath = `${VAR_FOLDER}/${fileName}`;
            phase.items[i].hash = hash;

            // eslint-disable-next-line no-await-in-loop
            const fileAvailable = await isFileAvailable(filePath);

            // if the file is available, point this resource to its path
            if (fileAvailable) {
              phase.items[i].asset = filePath;
            } else {
              // eslint-disable-next-line no-await-in-loop
              const isConnected = await isOnline();
              if (isConnected) {
                // eslint-disable-next-line no-await-in-loop
                const dl = await download(mainWindow, url, {
                  directory: VAR_FOLDER,
                  filename: fileName,
                });
                phase.items[i].asset = dl.getSavePath();
              } else {
                return mainWindow.webContents.send(
                  SAVE_SPACE_CHANNEL,
                  ERROR_DOWNLOADING_FILE
                );
              }
            }
          }
        }
      }
      // mark space as saved
      spaceToSave.saved = true;
      spaces.push(spaceToSave).write();
      return mainWindow.webContents.send(SAVE_SPACE_CHANNEL, spaceToSave);
    } catch (err) {
      logger.error(err);
      return mainWindow.webContents.send(SAVE_SPACE_CHANNEL, null);
    }
  });

  // called when getting a space
  ipcMain.on(GET_SPACE_CHANNEL, async (event, { id }) => {
    try {
      // get handle to spaces collection
      const space = db
        .get(SPACES_COLLECTION)
        .find({ id })
        .value();
      mainWindow.webContents.send(GET_SPACE_CHANNEL, space);
    } catch (err) {
      logger.error(err);
      mainWindow.webContents.send(GET_SPACE_CHANNEL, null);
    }
  });

  // called when getting all spaces
  ipcMain.on(GET_SPACES_CHANNEL, async () => {
    try {
      // get handle to spaces collection
      const spaces = db.get(SPACES_COLLECTION).value();
      mainWindow.webContents.send(GET_SPACES_CHANNEL, spaces);
    } catch (e) {
      logger.error(e);
    }
  });

  // ipcMain.on(DELETE_SPACE_CHANNEL, async (event, { id }) => {
  //   try {
  //     let spaces = [];
  //     let spaceImageUrl = '';
  //     const spacesPath = `${savedSpacesPath}/${spacesFileName}`;
  //     fs.readFile(spacesPath, 'utf8', async (err, data) => {
  //       if (err) {
  //         mainWindow.webContents.send(DELETED_SPACE_CHANNEL, ERROR_GENERAL);
  //       } else {
  //         spaces = JSON.parse(data);
  //         const allResources = [];
  //         const spaceResources = [];
  //
  //         // eslint-disable-next-line no-restricted-syntax
  //         for (const space of spaces) {
  //           const { phases, id: spaceId, image: imageUrl } = space;
  //           if (spaceId === id) {
  //             // to get the extension of the background image for the space to be deleted
  //             spaceImageUrl = imageUrl;
  //           }
  //           // eslint-disable-next-line no-restricted-syntax
  //           for (const phase of phases) {
  //             const { items = [] } = phase;
  //             for (let i = 0; i < items.length; i += 1) {
  //               const { resource } = items[i];
  //               if (resource) {
  //                 const { hash, type } = resource;
  //                 const fileName = `${hash}.${type}`;
  //                 const filePath = `${savedSpacesPath}/${fileName}`;
  //                 // eslint-disable-next-line no-await-in-loop
  //                 const fileAvailable = await isFileAvailable(filePath);
  //                 if (fileAvailable) {
  //                   if (spaceId === id) {
  //                     spaceResources.push(filePath);
  //                   } else {
  //                     allResources.push(filePath);
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //         // resources in the space but not used by other spaces
  //         const allResourcesSet = new Set(allResources);
  //         const spaceDistinctResources = new Set(
  //           [...spaceResources].filter(
  //             filePath => !allResourcesSet.has(filePath)
  //           )
  //         );
  //         const extension = spaceImageUrl.match(/[^\\]*\.(\w+)$/)[1];
  //         const backgroundImagePath = `${savedSpacesPath}/background-${id}.${extension}`;
  //         const backgroundImageExists = await isFileAvailable(
  //           backgroundImagePath
  //         );
  //         if (backgroundImageExists) {
  //           spaceDistinctResources.add(backgroundImagePath);
  //         }
  //         // delete all resources used by the space to be deleted only
  //         [...spaceDistinctResources].forEach(filePath =>
  //           fs.unlink(filePath, error => {
  //             if (error) {
  //               logger.error(error);
  //             }
  //           })
  //         );
  //         const newSpaces = spaces.filter(el => Number(el.id) !== Number(id));
  //         const spacesString = JSON.stringify(newSpaces);
  //         await fsPromises.writeFile(
  //           `${savedSpacesPath}/${spacesFileName}`,
  //           spacesString
  //         );
  //         mainWindow.webContents.send(DELETED_SPACE_CHANNEL);
  //       }
  //     });
  //   } catch {
  //     mainWindow.webContents.send(DELETED_SPACE_CHANNEL, ERROR_GENERAL);
  //   }
  // });

  // ipcMain.on(LOAD_SPACE_CHANNEL, async (event, { fileLocation }) => {
  //   try {
  //     const extractPath = `${savedSpacesPath}/tmp`;
  //     extract(fileLocation, { dir: extractPath }, async extractError => {
  //       if (extractError) {
  //         logger.error(extractError);
  //       } else {
  //         let space = {};
  //         const spacePath = `${extractPath}/space.json`;
  //         fs.readFile(spacePath, 'utf8', async (readFileError, data) => {
  //           if (readFileError) {
  //             logger.error(readFileError);
  //             mainWindow.webContents.send(
  //               LOADED_SPACE_CHANNEL,
  //               ERROR_ZIP_CORRUPTED
  //             );
  //             fse.remove(extractPath, removeError => {
  //               if (removeError) {
  //                 logger.error(removeError);
  //               }
  //             });
  //           } else {
  //             ncp(extractPath, savedSpacesPath, async ncpError => {
  //               if (ncpError) {
  //                 return logger.error(ncpError);
  //               }
  //               let spaces = [];
  //               space = JSON.parse(data);
  //               const spacesPath = `${savedSpacesPath}/${spacesFileName}`;
  //               return fs.readFile(
  //                 spacesPath,
  //                 'utf8',
  //                 async (readError, spacesData) => {
  //                   // we dont have saved spaces yet
  //                   if (readError) {
  //                     spaces.push(space);
  //                     const spacesString = JSON.stringify(spaces);
  //                     await fsPromises.writeFile(
  //                       `${savedSpacesPath}/${spacesFileName}`,
  //                       spacesString
  //                     );
  //                     mainWindow.webContents.send(LOADED_SPACE_CHANNEL, spaces);
  //                   } else {
  //                     try {
  //                       spaces = JSON.parse(spacesData);
  //                     } catch (e) {
  //                       mainWindow.webContents.send(
  //                         LOADED_SPACE_CHANNEL,
  //                         ERROR_JSON_CORRUPTED
  //                       );
  //                     }
  //                     // space id is a string
  //                     const spaceId = space.id;
  //                     const available = spaces.find(({ id }) => id === spaceId);
  //                     if (!available) {
  //                       spaces.push(space);
  //                       const spacesString = JSON.stringify(spaces);
  //                       await fsPromises.writeFile(
  //                         `${savedSpacesPath}/${spacesFileName}`,
  //                         spacesString
  //                       );
  //                       mainWindow.webContents.send(
  //                         LOADED_SPACE_CHANNEL,
  //                         spaces
  //                       );
  //                     } else {
  //                       mainWindow.webContents.send(
  //                         LOADED_SPACE_CHANNEL,
  //                         ERROR_SPACE_ALREADY_AVAILABLE
  //                       );
  //                     }
  //                   }
  //                   fs.unlink(`${savedSpacesPath}/space.json`, unlinkError => {
  //                     if (unlinkError) {
  //                       logger.error(unlinkError);
  //                     }
  //                   });
  //                   fse.remove(extractPath, removeError => {
  //                     if (removeError) {
  //                       logger.error(removeError);
  //                     }
  //                   });
  //                 }
  //               );
  //             });
  //           }
  //         });
  //       }
  //     });
  //   } catch (err) {
  //     logger.error(err);
  //   }
  // });

  // ipcMain.on(
  //   EXPORT_SPACE_CHANNEL,
  //   async (event, { archivePath, id, spaces }) => {
  //     try {
  //       // space ids are strings
  //       const space = spaces.find(el => el.id === id);
  //       const { phases, image: imageUrl } = space;
  //       const spacesString = JSON.stringify(space);
  //       const ssPath = `${savedSpacesPath}/space.json`;
  //       const filesPaths = [ssPath];
  //       if (imageUrl) {
  //         // regex to get file extension
  //         const extension = getExtension({ url: imageUrl });
  //         const backgroundImage = `background-${id}.${extension}`;
  //         const backgroundImagePath = `${savedSpacesPath}/${backgroundImage}`;
  //         const backgroundImageExists = await isFileAvailable(
  //           backgroundImagePath
  //         );
  //         if (backgroundImageExists) {
  //           filesPaths.push(backgroundImagePath);
  //         }
  //       }
  //       await fsPromises.writeFile(ssPath, spacesString);
  //       // eslint-disable-next-line no-restricted-syntax
  //       for (const phase of phases) {
  //         const { items = [] } = phase;
  //         for (let i = 0; i < items.length; i += 1) {
  //           const { resource } = items[i];
  //           if (resource) {
  //             const { hash, type } = resource;
  //             const fileName = `${hash}.${type}`;
  //             const filePath = `${savedSpacesPath}/${fileName}`;
  //             // eslint-disable-next-line no-await-in-loop
  //             const fileAvailable = await isFileAvailable(filePath);
  //             if (fileAvailable) {
  //               filesPaths.push(filePath);
  //             }
  //           }
  //         }
  //       }
  //       const output = fs.createWriteStream(archivePath);
  //       const archive = archiver('zip', {
  //         zlib: { level: 9 },
  //       });
  //       output.on('close', () => {
  //         fs.unlink(ssPath, err => {
  //           if (err) {
  //             logger.error(err);
  //           }
  //         });
  //         mainWindow.webContents.send(EXPORTED_SPACE_CHANNEL);
  //       });
  //       output.on('end', () => {
  //         mainWindow.webContents.send(EXPORTED_SPACE_CHANNEL, ERROR_GENERAL);
  //       });
  //       archive.on('warning', err => {
  //         if (err.code === 'ENOENT') {
  //           logger.error(err);
  //         }
  //       });
  //       archive.on('error', () => {
  //         mainWindow.webContents.send(EXPORTED_SPACE_CHANNEL, ERROR_GENERAL);
  //       });
  //       archive.pipe(output);
  //       filesPaths.forEach(filePath => {
  //         const pathArr = filePath.split('/');
  //         archive.file(filePath, { name: pathArr[pathArr.length - 1] });
  //       });
  //       archive.finalize();
  //     } catch (err) {
  //       logger.error(err);
  //       mainWindow.webContents.send(EXPORTED_SPACE_CHANNEL, ERROR_GENERAL);
  //     }
  //   }
  // );

  ipcMain.on(SHOW_OPEN_DIALOG_CHANNEL, (event, options) => {
    dialog.showOpenDialog(null, options, filePaths => {
      mainWindow.webContents.send(
        OPEN_DIALOG_PATHS_SELECTED_CHANNEL,
        filePaths
      );
    });
  });
  ipcMain.on(SHOW_SAVE_DIALOG_CHANNEL, (event, spaceTitle) => {
    const options = {
      title: 'Save As',
      defaultPath: `${spaceTitle}.zip`,
    };
    dialog.showSaveDialog(null, options, filePath => {
      mainWindow.webContents.send(SAVE_DIALOG_PATH_SELECTED_CHANNEL, filePath);
    });
  });
  ipcMain.on(SHOW_MESSAGE_DIALOG_CHANNEL, () => {
    const options = {
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      cancelId: 0,
      message: 'Are you sure you want to delete this space?',
    };
    dialog.showMessageBox(null, options, respond => {
      mainWindow.webContents.send(MESSAGE_DIALOG_RESPOND_CHANNEL, respond);
    });
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('load-page', (event, arg) => {
  mainWindow.loadURL(arg);
});