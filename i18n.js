const TRANSLATIONS = {
  en: {
    // navbar / dropdown
    edit_profile: 'Edit profile',
    language_btn: '中文',
    logout: 'Log out',
    // profile modal
    edit_profile_title: 'Edit profile',
    username_label: 'Username',
    email_label: 'Email',
    new_password: 'New password',
    pw_ph: 'Leave blank to keep current',
    save: 'Save',
    cancel: 'Cancel',
    // login / register
    login_title: 'Log in',
    signup_title: 'Sign up',
    back_to_login: 'Back to Log in',
    username_ph: 'User name / Email',
    password_ph: 'Password',
    account_created: 'Account created! Please log in.',
    // index
    greeting_morning: 'Good morning! Ready for breakfast?',
    greeting_afternoon: 'Good afternoon! Time for lunch?',
    greeting_evening: "Good evening! What's for dinner?",
    add_meal: 'Add Meal',
    view_log: 'View Log',
    report: 'Report',
    // add meal
    add_title: 'ADD A MEAL',
    title_label: 'Title:',
    title_ph: 'What did you eat?',
    meal_type: 'This is your:',
    meal_time: 'It was on:',
    select_type: 'Select meal type',
    add_tag: 'Add a tag:',
    included: 'Included:',
    submit: 'Submit',
    update: 'Update',
    tag_diet: 'Diet meal',
    tag_cheat: 'Cheat meal',
    tag_balanced: 'Balanced',
    tag_light: 'Light',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    brunch: 'Brunch',
    snack: 'Snack',
    // log
    today: 'Today',
    yesterday: 'Yesterday',
    history: 'History',
    recent_history: 'Recent history',
    meals_recorded: 'meals recorded',
    no_meals: 'No meals recorded yet',
    add_first: 'Add your first meal',
    suggestions_title: "Today's suggestions",
    all_groups: "You've covered all food groups today! 🎉",
    tip_grains: 'Try adding rice, bread, or oatmeal to your next meal.',
    tip_protein: 'Consider eggs, chicken, beans, or tofu.',
    tip_vegetables: 'Sneak in some leafy greens, carrots, or bell peppers.',
    tip_fruits: 'Grab an apple, banana, or a handful of berries.',
    tip_dairy: 'A glass of milk or some yogurt would round things out.',
    tip_snacks: 'A small healthy snack like nuts could help.',
    // report
    this_month: 'This Month',
    this_week: 'This Week',
    last_7: 'Last 7 Days',
    days_covered: 'Days covered',
    avg_meals: 'Avg meals / day',
    most_consumed: 'Most consumed',
    most_missing: 'Most missing',
  },
  zh: {
    // navbar / dropdown
    edit_profile: '编辑资料',
    language_btn: 'English',
    logout: '退出登录',
    // profile modal
    edit_profile_title: '编辑资料',
    username_label: '用户名',
    email_label: '邮箱',
    new_password: '新密码',
    pw_ph: '留空则不修改',
    save: '保存',
    cancel: '取消',
    // login / register
    login_title: '登录',
    signup_title: '注册',
    back_to_login: '返回登录',
    username_ph: '用户名 / 邮箱',
    password_ph: '密码',
    account_created: '注册成功！请登录。',
    // index
    greeting_morning: '早上好！准备好吃早餐了吗？',
    greeting_afternoon: '下午好！午餐时间到了！',
    greeting_evening: '晚上好！今晚吃什么？',
    add_meal: '添加餐食',
    view_log: '查看记录',
    report: '报告',
    // add meal
    add_title: '添加餐食',
    title_label: '名称：',
    title_ph: '你吃了什么？',
    meal_type: '这是你的：',
    meal_time: '用餐时间：',
    select_type: '选择餐食类型',
    add_tag: '添加标签：',
    included: '包含：',
    submit: '提交',
    update: '更新',
    tag_diet: '减脂餐',
    tag_cheat: '放纵餐',
    tag_balanced: '均衡餐',
    tag_light: '轻食',
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    brunch: '早午餐',
    snack: '零食',
    // log
    today: '今天',
    yesterday: '昨天',
    history: '历史',
    recent_history: '最近记录',
    meals_recorded: '条记录',
    no_meals: '今天还没有记录',
    add_first: '添加第一餐',
    suggestions_title: '今日建议',
    all_groups: '今天六大类食物全部覆盖！🎉',
    tip_grains: '试试在下一餐加入米饭、面包或燕麦。',
    tip_protein: '可以考虑鸡蛋、鸡肉、豆类或豆腐。',
    tip_vegetables: '加点绿叶蔬菜、胡萝卜或彩椒吧。',
    tip_fruits: '吃个苹果、香蕉或一把浆果。',
    tip_dairy: '一杯牛奶或一些酸奶会很不错。',
    tip_snacks: '一小把坚果这样的健康零食会有帮助。',
    // report
    this_month: '本月',
    this_week: '本周',
    last_7: '最近7天',
    days_covered: '覆盖天数',
    avg_meals: '日均餐数',
    most_consumed: '最常摄入',
    most_missing: '最常缺失',
  }
};

function getLang() { return localStorage.getItem('lang') || 'en'; }

function t(key) {
  const lang = getLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key])
    || TRANSLATIONS['en'][key]
    || key;
}

function toggleLanguage() {
  const newLang = getLang() === 'en' ? 'zh' : 'en';
  localStorage.setItem('lang', newLang);
  applyLanguage();
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = newLang === 'zh' ? 'English' : '中文';
  if (typeof showNotification === 'function') {
    showNotification(newLang === 'zh' ? '已切换为中文' : 'Switched to English', 'success');
  }
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  const langBtn = document.getElementById('langToggleBtn');
  if (langBtn) langBtn.textContent = getLang() === 'en' ? '中文' : 'English';
}