/**
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/
 * @see https://developer.chrome.com/docs/extensions/reference/commands/
 * @see https://github.com/GoogleChrome/chrome-extensions-samples
 */

// 获取当前标签
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// 获取当前标签页 Index
async function getCurrentTabIndex() {
  const currentTab = await getCurrentTab();
  return currentTab.index;
}

// 获取标签
async function getTabs() {
  const currentWindow = await chrome.windows.getCurrent();
  return await chrome.tabs.query({ windowId: currentWindow.id });
}

// 判断标签是否未分组
const notGrouped = (tab) => tab.groupId === -1;

// 获取所有标签
async function getAllTabs(tabs) {
  return tabs.filter((tab) => notGrouped(tab)).map((tab) => tab.id);
}

// 获取左侧标签
async function getLeftTabs(tabs) {
  const currentTabIndex = await getCurrentTabIndex();
  const inRange = (tab) => tab.index <= currentTabIndex;
  return tabs.filter((tab) => notGrouped(tab) && inRange(tab)).map((tab) => tab.id);
}

// 获取右侧标签
async function getRightTabs(tabs) {
  const currentTabIndex = await getCurrentTabIndex();
  const inRange = (tab) => tab.index >= currentTabIndex;
  return tabs.filter((tab) => notGrouped(tab) && inRange(tab)).map((tab) => tab.id);
}

// 定义保存标签页到组的函数
async function saveTabsToGroup(tabIds) {
  if (tabIds.length) {
    const group = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(group, { title: 'Unsaved Group' });
  }
}

// 定义右键菜单项的类型
const actionType = {
  saveAllTabs: 'saveAllTabs',
  saveLeftTabs: 'saveLeftTabs',
  saveRightTabs: 'saveRightTabs',
}

const CONTEXT_MENUS_ID = "saveTabsToGroup";

// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
  // 创建主菜单项
  chrome.contextMenus.create({
    id: CONTEXT_MENUS_ID,
    title: "Save Tabs to Group",
    contexts: ["all"]
  });

  // 创建子菜单项 - 所有标签
  chrome.contextMenus.create({
    id: actionType.saveAllTabs,
    parentId: CONTEXT_MENUS_ID,
    title: "All Tabs",
    contexts: ["all"]
  });
  // 创建子菜单项 - 左侧所有标签
  chrome.contextMenus.create({
    id: actionType.saveLeftTabs,
    parentId: CONTEXT_MENUS_ID,
    title: "Tabs to the Left",
    contexts: ["all"]
  });

  // 创建子菜单项 - 右侧所有标签
  chrome.contextMenus.create({
    id: actionType.saveRightTabs,
    parentId: CONTEXT_MENUS_ID,
    title: "Tabs to the Right",
    contexts: ["all"]
  });
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabs = await getTabs();
  let tabIds = [];

  switch (info.menuItemId) {
    case actionType.saveAllTabs:
      tabIds = await getAllTabs(tabs);
      break;
    case actionType.saveLeftTabs:
      tabIds = await getLeftTabs(tabs);
      break;
    case actionType.saveRightTabs:
      tabIds = await getRightTabs(tabs);
      break;
  }

  saveTabsToGroup(tabIds);
});
