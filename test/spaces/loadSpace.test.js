/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { expect } from 'chai';
import path from 'path';
import { mochaAsync, createRandomString } from '../utils';
import { createApplication, closeApplication } from '../application';
import { menuGoToLoadSpace, menuGoToHome } from '../menu.test';
import {
  buildSpaceCardId,
  SPACE_CARD_LINK_CLASS,
  LOAD_LOAD_BUTTON_ID,
  SPACE_EXPORT_BUTTON_CLASS,
  LOAD_INPUT_ID,
  SPACE_DELETE_BUTTON_CLASS,
  HOME_MAIN_ID,
  PHASE_MENU_LIST_ID,
  PHASE_MENU_ITEM,
} from '../../src/config/selectors';
import {
  SPACE_ATOMIC_STRUCTURE,
  SPACE_ATOMIC_STRUCTURE_PATH,
  SPACE_ATOMIC_STRUCTURE_WITH_CHANGES,
  SPACE_ATOMIC_STRUCTURE_WITH_CHANGES_PATH,
} from '../fixtures/spaces';
import { hasSavedSpaceLayout, visitAndSaveSpaceById } from './visitSpace.test';
import {
  TOOLTIP_FADE_OUT_PAUSE,
  INPUT_TYPE_PAUSE,
  LOAD_SPACE_PAUSE,
  EXPORT_SPACE_PAUSE,
  EXPORT_FILEPATH,
  DELETE_SPACE_PAUSE,
  OPEN_SAVED_SPACE_PAUSE,
  LOAD_PHASE_PAUSE,
  DEFAULT_GLOBAL_TIMEOUT,
} from '../constants';
import { userSignIn } from '../userSignIn.test';
import { USER_GRAASP } from '../fixtures/users';
import { typeInTextInputApp } from '../apps/textInputApp';

/* eslint-disable-next-line import/prefer-default-export */
export const loadSpaceById = async (client, { space: { id } }, filepath) => {
  await menuGoToLoadSpace(client);

  // input space id
  const absolutePath = path.resolve(__dirname, '../fixtures/spaces', filepath);
  await client.setValue(`#${LOAD_INPUT_ID}`, absolutePath);
  await client.pause(INPUT_TYPE_PAUSE);

  const value = await client.getValue(`#${LOAD_INPUT_ID}`);
  expect(value).to.equal(absolutePath);

  await client.click(`#${LOAD_LOAD_BUTTON_ID}`);
  await client.pause(LOAD_SPACE_PAUSE);

  // go to space
  await menuGoToHome(client);

  await client.click(`#${buildSpaceCardId(id)} .${SPACE_CARD_LINK_CLASS}`);

  // this waiting time is longer to wait for tooltip to fade out
  await client.pause(OPEN_SAVED_SPACE_PAUSE);
};

describe('Load Space Scenarios', function() {
  this.timeout(DEFAULT_GLOBAL_TIMEOUT);
  let app;

  afterEach(function() {
    return closeApplication(app);
  });

  describe('predefined export spaces', function() {
    beforeEach(
      mochaAsync(async () => {
        app = await createApplication();
        await userSignIn(app.client, USER_GRAASP);
      })
    );

    it(
      `Cannot load space with a non-zip file`,
      mochaAsync(async () => {
        const { client } = app;

        // load space
        await menuGoToLoadSpace(client);

        await client.setValue(`#${LOAD_INPUT_ID}`, 'somefilepath');
        await client.pause(INPUT_TYPE_PAUSE);

        const loadButtonHtml = await client.getHTML(`#${LOAD_LOAD_BUTTON_ID}`);
        expect(loadButtonHtml).to.include('disabled');
      })
    );

    it(
      `Load space ${SPACE_ATOMIC_STRUCTURE.space.name}`,
      mochaAsync(async () => {
        const { client } = app;

        await loadSpaceById(
          client,
          SPACE_ATOMIC_STRUCTURE,
          SPACE_ATOMIC_STRUCTURE_PATH
        );

        await hasSavedSpaceLayout(client, SPACE_ATOMIC_STRUCTURE);
      })
    );

    it(
      `Cannot load already saved space of ${SPACE_ATOMIC_STRUCTURE.space.name}`,
      mochaAsync(async () => {
        const {
          space: { id },
        } = SPACE_ATOMIC_STRUCTURE;
        const { client } = app;

        // get space
        await visitAndSaveSpaceById(client, id);

        // load space
        await loadSpaceById(
          client,
          SPACE_ATOMIC_STRUCTURE_WITH_CHANGES,
          SPACE_ATOMIC_STRUCTURE_WITH_CHANGES_PATH
        );

        // go to space
        await menuGoToHome(client);

        const savedSpacesHtml = await client.getHTML(`#${HOME_MAIN_ID}`);
        expect(savedSpacesHtml).to.not.include(
          SPACE_ATOMIC_STRUCTURE_WITH_CHANGES.space.name
        );
        await client.pause(OPEN_SAVED_SPACE_PAUSE);

        await client.click(
          `#${buildSpaceCardId(id)} .${SPACE_CARD_LINK_CLASS}`
        );
        // check content hasn't changed
        await hasSavedSpaceLayout(client, SPACE_ATOMIC_STRUCTURE);
      })
    );
  });

  it(
    `Load exported space of ${SPACE_ATOMIC_STRUCTURE.space.name}`,
    mochaAsync(async () => {
      const {
        space: { id },
      } = SPACE_ATOMIC_STRUCTURE;

      const filepath = `${EXPORT_FILEPATH}_${createRandomString()}.zip`;
      app = await createApplication({
        showSaveDialogResponse: filepath,
        showMessageDialogResponse: 1,
      });

      const { client } = app;

      await userSignIn(client, USER_GRAASP);

      // get space
      await visitAndSaveSpaceById(client, id);

      // export space
      await client.click(`.${SPACE_EXPORT_BUTTON_CLASS}`);
      await client.pause(EXPORT_SPACE_PAUSE);
      await client.pause(TOOLTIP_FADE_OUT_PAUSE);

      // delete space
      await client.click(`.${SPACE_DELETE_BUTTON_CLASS}`);
      await client.pause(DELETE_SPACE_PAUSE);

      // load space
      await loadSpaceById(client, SPACE_ATOMIC_STRUCTURE, filepath);

      // check content
      await hasSavedSpaceLayout(client, SPACE_ATOMIC_STRUCTURE);
    })
  );

  it(
    `Load exported space of ${SPACE_ATOMIC_STRUCTURE.space.name} with added user input`,
    mochaAsync(async () => {
      const {
        space: { id, phases },
      } = SPACE_ATOMIC_STRUCTURE;

      const filepath = `${EXPORT_FILEPATH}_${createRandomString()}.zip`;
      app = await createApplication({
        showSaveDialogResponse: filepath,
        showMessageDialogResponse: 1,
      });

      const { client } = app;

      await userSignIn(client, USER_GRAASP);

      // get space
      await visitAndSaveSpaceById(client, id);

      // add user input
      await client.click(`#${PHASE_MENU_LIST_ID} li#${PHASE_MENU_ITEM}-${0}`);
      await client.pause(LOAD_PHASE_PAUSE);

      // type in text input app
      const { id: appId, appInstance } = phases[0].items[1];
      const resources = [
        {
          data: 'user input in space with graasp account',
          appInstance: appInstance.id,
        },
      ];
      await typeInTextInputApp(client, appId, resources[0].data);

      // export space
      await client.click(`.${SPACE_EXPORT_BUTTON_CLASS}`);
      await client.pause(EXPORT_SPACE_PAUSE);
      await client.pause(TOOLTIP_FADE_OUT_PAUSE);

      // delete space
      await client.click(`.${SPACE_DELETE_BUTTON_CLASS}`);
      await client.pause(DELETE_SPACE_PAUSE);

      // load space
      await loadSpaceById(client, SPACE_ATOMIC_STRUCTURE, filepath);

      // check content
      await hasSavedSpaceLayout(client, SPACE_ATOMIC_STRUCTURE, resources);
    })
  );
});
