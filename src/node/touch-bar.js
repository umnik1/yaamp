const { TouchBar, nativeImage } = require('electron');
const { TouchBarButton, TouchBarSpacer } = TouchBar;
const mainWindow = require('./main-window');

const prev = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAASZJREFUOE9jXLv12H8GKoPr9+8zzJ8wmYERZLiTlyXVjN+37TjD0nVrGS4dOIow/Nz56xRb8OH5BwaQq48dO8Zw69S5ATK8t2cq3CfFJdkYvoLJI8uBXH7u/DmG89euM9w6eRa3y0Gaff38GCLC3RjQgwyXHIrh+IIFlwEwcZBX0C2myHBkgwkZfvv0eeKDBd1gQobjTS3owWJkqMmwYuUulIjFFywkuRxkKroFVDUc3QKqG45sAdmGg4IABrAVDTB5ZDnkpIgS5qAChxoAlkPhhoMMBRU43z+8p4b54Ox/5/QFBsaWKUv/g2z78f0HVQyGGXL7zAUGRnl5w/+MDIwIgxkhbCZGBob/DFAZRkYGRqg4SA4k+h8k9h9UzzAyMCDLwdQCpQBA03BAzydq3wAAAABJRU5ErkJggg=='),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.get()?.webContents.send('prevTrack');
  },
});

const play = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAQ9JREFUOE/FlbESwUAQhnfzLswo6YxOoTBDyzsoeQQlHaWSjoKhVJ4uoRGqoFFKR3dmw0oGiRM345rM3F2+/78/uxccToUEzcN2HBh0e4AEzxez2vDz2QL6oyFshOXDTcv+WcA9ukCuhRBwWG3+BG+3ut5J6o2a8onIuWmZYK1t2C0jnBO8VC7DZDxWFgnCI2NhONtWEfna+XMmUSKxnauIaINXKwVPL1jCQfh+tQ0vxefM2fk7KK/Fdh4FfQ9XcK4C/RqeSadeMv3UTaGZ04WjY3CHPj4oQenCObsnHXyv/Q9ULc1OX5La5XzRAmaI5zyZyEkABDTQhyMC8i8Eb/PIT+B9/n7j/q6ktfs0SgOutQw52vzOQLoAAAAASUVORK5CYII='),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.get()?.webContents.send('playPause');
  },
});

const next = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAPtJREFUOE9jXLv12H8GKoPr9+8zaCoqMjCCDHfysqSa8fu2HWdYum4tQ3RQMMLwc+evU2zBh+cfGECuPnbsGENydPQAGd7bMxXsk+KSbAwfweTQ5UEuP3f+HMP5a9fxuxxkgK+fH8PmTZswLIDJRYS7MSAHJ8mGg1yHbgFVDUe3gOqGI1tAE8NhYUx1w5Ejj6qGo6cKqhmObjAo7Ck23MhQE5x5sBULMDl0eZzpHFTgUANg5FCQoaAC5/uH99QwH5z93917z8DYMmXpf5BtP77/oIrBMEP2rVvKwGhmFgquLBgZmRj+///PwMjIiNUSRgbs4gw41F+4sJ0BABVaXHLFWpERAAAAAElFTkSuQmCC'),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.get()?.webContents.send('nextTrack');
  },
});

const trackinfo = new TouchBarButton({
  backgroundColor: '#000000',
  textColor: '#01E804',
  label: '',
  click: () => {
    mainWindow.get()?.webContents.send('nextTrack');
  },
});

const touchBar = new TouchBar({
  items: [prev, play, next, new TouchBarSpacer({ size: 'small' }), trackinfo],
});

module.exports = { touchBar, play, trackinfo };
