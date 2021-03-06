import {
  SYNC_MODES,
  USER_MODES,
  DEFAULT_ACTION_ACCESSIBILITY,
  DEFAULT_ACTIONS_AS_ENABLED,
} from '../config/constants';

const SampleDatabase = {
  spaces: [
    {
      category: 'Space 1',
      description:
        'This is a sample space that you can use to test apps and labs.',
      id: '6ccb068bbb18b80359966631',
      image: {
        backgroundUrl: 'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg',
      },
      language: 'en',
      name: 'Sample Space 1',
      offlineSupport: true,
      phases: [
        {
          category: 'Space',
          description:
            '<p>This is the sample first phase of the sample space.</p>',
          id: '6acb068bbb18b80359966634',
          items: [
            {
              category: 'Resource',
              content:
                '<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>',
              description: '',
              id: '5cce86096e2aaf40bad2d0fd',
              mimeType: 'text/html',
              name: 'sample.graasp',
            },
            {
              category: 'Resource',
              description: '',
              hash: '093f8bb0e21e19bfe62d0a7880d5f985',
              id: '9cce87b96e2aaf30bad2d127',
              mimeType: 'image/jpeg',
              name: 'Sample.jpg',
              url: 'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg',
            },
          ],
          name: 'Sample Introduction',
        },
        {
          category: 'Space',
          description: '<p>Use this space to test your apps.</p>',
          id: '5ccb068cbb18b80359966638',
          items: [
            {
              category: 'Resource',
              content:
                '<p>This is the sample Input Box application running on our production server. If you go to <em>Developer</em> and edit the database manually, you can replace the URL with your own HTML file.</p>',
              description: '',
              id: '6cce86a66e2aaf30bad2d0fe',
              mimeType: 'text/html',
              name: 'instructions.graasp',
            },
            {
              category: 'Application',
              description: '',
              hash: 'af246f6f27d0d090bdb63cebddce262c',
              id: '5de2c2e23b209c1877b3dc80',
              name: 'Input Box',
              url:
                'https://apps.graasp.eu/5acb589d0d5d9464081c2d46/5cde9891226a7d20a8a16697/latest/index.html',
              asset: '',
              appInstance: {
                id: '5ce2c2e23a209c1877b3dc80',
                settings: {
                  headerVisible: false,
                },
                resources: [],
                createdAt: '2019-05-21T17:06:29.683Z',
                updatedAt: '2019-05-24T13:24:05.073Z',
              },
            },
          ],
          name: 'Sandbox',
        },
      ],
      saved: true,
    },
    {
      category: 'Space 2',
      description:
        'This is a second sample space that you can use to test apps and labs.',
      id: '6ccb068bbb18b80359966632',
      image: {
        backgroundUrl: 'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg',
      },
      language: 'en',
      name: 'Sample Space 2',
      offlineSupport: true,
      phases: [
        {
          category: 'Space',
          description:
            '<p>This is the sample first phase of the sample space.</p>',
          id: '6acb068bbb18b80359966612',
          items: [
            {
              category: 'Resource',
              content:
                '<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>',
              description: '',
              id: '5cce86096e2aaf40bad2d043',
              mimeType: 'text/html',
              name: 'sample.graasp',
            },
            {
              category: 'Resource',
              description: '',
              hash: '093f8bb0e21e19bfe62d0a7880d5f912',
              id: '9cce87b96e2aaf30bad2d127',
              mimeType: 'image/jpeg',
              name: 'Sample.jpg',
              url: 'https://d28t6ykz01qrod.cloudfront.net/epfl/bg.jpg',
            },
          ],
          name: 'Sample Introduction',
        },
        {
          category: 'Space',
          description: '<p>Use this space to test your apps.</p>',
          id: '5ccb068cbb18b80359966634',
          items: [
            {
              category: 'Resource',
              content:
                '<p>This is the sample Input Box application running on our production server. If you go to <em>Developer</em> and edit the database manually, you can replace the URL with your own HTML file.</p>',
              description: '',
              id: '6cce86a66e2aaf30b3d2d0fe',
              mimeType: 'text/html',
              name: 'instructions.graasp',
            },
            {
              category: 'Application',
              description: '',
              hash: 'af246f6f27d0d090bdb63cebddce262d',
              id: '5de2c2e23b209c1877b3dc81',
              name: 'Input Box',
              url:
                'https://apps.graasp.eu/5acb589d0d5d9464081c2d46/5cde9891226a7d20a8a16697/latest/index.html',
              asset: '',
              appInstance: {
                id: '5ce2c2323a209c1877b3dc80',
                settings: {
                  headerVisible: false,
                },
                createdAt: '2019-05-21T17:06:29.683Z',
                updatedAt: '2019-05-24T13:24:05.073Z',
              },
            },
          ],
          name: 'Sandbox',
        },
      ],
      saved: true,
    },
  ],
  user: {},
  actions: [
    {
      appInstance: '5ce2c2323a209c1877b3dc80',
      createdAt: '2019-05-21T17:06:29.683Z',
      updatedAt: '2019-05-24T13:24:05.073Z',
      data: 'Sample text.',
      format: 'v1',
      type: 'input',
      visibility: 'private',
      user: '1',
      id: '5ce430152f6f6672b16fca57',
      verb: 'saved',
      spaceId: '6ccb068bbb18b80359966631',
    },
  ],
  users: [
    {
      id: '1',
      username: 'graasp',
      createdAt: '2019-05-21T17:06:29.683Z',
      geolocation: null,
      settings: {
        lang: 'en',
        developerMode: true,
        geolocationEnabled: false,
        syncMode: SYNC_MODES.ADVANCED,
        userMode: USER_MODES.TEACHER,
        actionsEnabled: DEFAULT_ACTIONS_AS_ENABLED,
        actionAccessibility: DEFAULT_ACTION_ACCESSIBILITY,
      },
    },
  ],
  appInstanceResources: [
    {
      appInstance: '5ce2c2323a209c1877b3dc80',
      createdAt: '2019-05-21T17:06:29.683Z',
      updatedAt: '2019-05-24T13:24:05.073Z',
      data: 'Sample text.',
      format: 'v1',
      type: 'input',
      visibility: 'private',
      user: '5ce422795fe28eeca1001e0a',
      id: '5ce430152f6f6672b16fca57',
      spaceId: '6ccb068bbb18b80359966632',
    },
  ],
  classrooms: [
    {
      spaces: [],
      users: [],
      appInstanceResources: [],
      actions: [],
      id: 'id',
      name: 'my classroom name',
    },
  ],
};

export default SampleDatabase;
