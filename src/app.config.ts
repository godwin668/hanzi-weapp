export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/practice/index',
    'pages/history/index',
    'pages/mine/index',
    'pages/write/index',
    'pages/trace/index',
    'pages/test/index',
    'pages/result/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#47B881',
    navigationBarTitleText: '汉字练字',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#B5C4BA',
    selectedColor: '#47B881',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png'
      },
      {
        pagePath: 'pages/practice/index',
        text: '练字',
        iconPath: 'assets/tabbar/practice.png',
        selectedIconPath: 'assets/tabbar/practice-selected.png'
      },
      {
        pagePath: 'pages/history/index',
        text: '记录',
        iconPath: 'assets/tabbar/history.png',
        selectedIconPath: 'assets/tabbar/history-selected.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png'
      }
    ]
  }
})
