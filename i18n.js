/* Matter Fee Manager — interface strings (English + 简体中文).
 * {0} {1} … are placeholders. A key ending in _1 is the singular form used when the first argument is 1.
 */
(function (root) {
  'use strict';
  var STR = { en: {}, zh: {} };
  function add(key, en, zh) { STR.en[key] = en; STR.zh[key] = zh; }

  // statuses
  add('st0', 'Not started', '未开始');
  add('st1', 'Done · to invoice', '已完成 · 待开票');
  add('st2', 'Invoiced · unpaid', '已开票 · 待付款');
  add('st3', 'Paid', '已收款');

  // per-stage timing notes
  add('note_done_wait', 'Done {0}d ago, not invoiced', '完成 {0} 天未开票');
  add('note_done_today', 'Done today, to invoice', '今天完成，待开票');
  add('note_nodue', 'No due date set', '未设到期日');
  add('note_late', '{0} days overdue', '逾期 {0} 天');
  add('note_late_1', '1 day overdue', '逾期 1 天');
  add('note_today', 'Due today', '今天到期');
  add('note_in', 'Due in {0} days', '{0} 天后到期');
  add('note_in_1', 'Due in 1 day', '1 天后到期');
  add('note_paid_on', 'Paid {0}', '收款 {0}');
  add('note_paid', 'Paid', '已收款');
  add('note_part', 'Part paid {0}', '已收部分 {0}');

  // badges
  add('bd_over', 'Overdue {0} · {1}d', '逾期 {0} · {1}天');
  add('bd_unpaid', 'Unpaid {0}', '待付款 {0}');
  add('bd_toinv', 'To invoice {0}', '待开票 {0}');
  add('bd_full', 'Paid in full {0}', '费用已收清 {0}');
  add('bd_prog', 'Paid {0} / {1}', '已收 {0} / {1}');
  add('fee_progress', 'Fee progress', '收费进度');
  add('recv_now', 'Receivable now', '应收未收');

  // default template
  add('tpl_name', 'Three-stage example (fill in amounts)', '三阶段示例（金额自填）');
  add('tpl_s1', 'Deposit on engagement', '签约 / 首期');
  add('tpl_s2', 'Work delivered', '工作交付');
  add('tpl_s3', 'Completion', '结案');

  // connector: buttons, menus, dialogs
  add('btn_fee', 'Fee schedule', '收费表');
  add('sec_title', 'Staged fee schedule', '分阶段收费表');
  add('btn_recv', 'Receivables', '应收总览');
  add('ov_title', 'Matter Fee · Receivables', 'Matter Fee · 应收总览');
  add('set_title', 'Matter Fee settings', 'Matter Fee 设置');
  add('new_blank', 'New blank fee schedule', '新建空白收费表');
  add('use_tpl', 'Use template: {0}', '套用模板：{0}');
  add('append_tpl', 'Append template stages: {0}', '追加模板阶段：{0}');
  add('del_menu', 'Delete this card\'s fee schedule…', '删除本卡收费表…');
  add('open_ov', 'Open receivables overview', '打开应收总览');
  add('too_many', 'Too many stages: this would exceed Trello\'s per-card storage limit. Nothing was added.', '阶段太多，超出 Trello 单卡存储上限，未追加。');
  add('del_title', 'Delete fee schedule', '删除收费表');
  add('del_msg', 'This deletes every fee stage recorded on this card. It cannot be undone.', '将删除本卡片的全部收费阶段记录，无法恢复。');
  add('del_ok', 'Delete', '删除');
  add('cancel', 'Cancel', '取消');

  // card-back section
  add('err_amount', 'An amount is not valid (digits only, up to two decimals). Fix it, then save.', '有金额格式不对（只能是数字，最多两位小数），改正后再保存。');
  add('err_recv', 'Received cannot be more than the stage amount. Set the stage to Paid instead.', '已收金额不能超过阶段金额。全部收到请直接把状态改为「已收款」。');
  add('err_size', 'This exceeds Trello\'s per-card storage limit (about 4,000 characters). Shorten stage names or use fewer stages.', '内容超出 Trello 单卡存储上限（约 4000 字符）。请缩短阶段名称或减少阶段数。');
  add('err_save', 'Save failed: {0}. Your edits are still on the page; try again.', '保存失败：{0}。修改仍在页面上，可重试。');
  add('err_unknown', 'unknown error', '未知错误');
  add('err_conflict', 'Someone else changed this fee schedule while you were editing. Nothing has been overwritten yet.', '在你编辑期间，其他人修改了这张卡片的收费表。目前没有覆盖任何内容。');
  add('btn_reload', 'Load their version (discard mine)', '载入对方的版本（放弃我的修改）');
  add('btn_overwrite', 'Keep mine (overwrite theirs)', '保留我的（覆盖对方的）');
  add('k_total', 'Contract total', '合同总额');
  add('n_stages', '{0} stages', '{0} 个阶段');
  add('n_stages_1', '1 stage', '1 个阶段');
  add('k_recv', 'Received', '已收款');
  add('n_of_stages', '{0} / {1} stages paid', '{0} / {1} 阶段已收清');
  add('sub_toinv', 'To invoice {0}', '待开票 {0}');
  add('sub_unpaid', 'Unpaid {0}', '待付款 {0}');
  add('sub_over', '{0}d overdue', '逾期 {0} 天');
  add('k_now', 'Receivable now', '应收未收');
  add('sub_none', 'Nothing due right now', '目前没有该收的款');
  add('k_notdue', 'Not yet due', '未到阶段');
  add('sub_notdone', 'Work not done yet', '工作未完成，暂不收');
  add('lg_recv', 'Received', '已收款');
  add('lg_over', 'Overdue', '逾期未付');
  add('lg_inv', 'Invoiced, unpaid', '已开票待付款');
  add('lg_done', 'Done, to invoice', '已完成待开票');
  add('lg_notdue', 'Not yet due', '未到阶段');
  add('mismatch', 'Stages add up to {0} ≠ contract total {1} (difference {2}). Check the stage amounts or the contract total.', '阶段合计 {0} ≠ 合同总额 {1}（差 {2}）。请核对阶段金额或合同总额。');
  add('ro', 'Read-only (you cannot edit this card)', '只读（你对这张卡片没有编辑权限）');
  add('saving', 'Saving…', '保存中…');
  add('unsaved', 'Unsaved changes', '有未保存的修改');
  add('discard', 'Discard', '撤销');
  add('save', 'Save', '保存');
  add('saved', 'Saved', '已保存');
  add('ph_stage', 'Stage name (e.g. Work delivered)', '阶段名称（如：递交申请）');
  add('ph_inv', 'Invoice no.', '发票号');
  add('ti_paid', 'Date paid', '收款日');
  add('ti_due', 'Payment due date (applies once invoiced)', '付款到期日（开票后生效）');
  add('confirm_del', 'Confirm delete', '确认删除');
  add('ti_del', 'Delete this stage', '删除此阶段');
  add('d_done', 'Done {0}', '完成 {0}');
  add('d_inv', 'Invoiced {0}', '开票 {0}');
  add('l_paid', 'Paid', '收款日');
  add('l_due', 'Due', '到期日');
  add('l_recv', 'Received', '已收');
  add('ti_recv', 'Amount received so far on this invoice (part payment)', '这张账单目前已收到的金额（部分付款）');
  add('up', 'Move up', '上移');
  add('down', 'Move down', '下移');
  add('empty', 'No fee stages yet.', '还没有收费阶段。');
  add('h_stage', 'Stage', '阶段');
  add('h_amount', 'Amount', '金额');
  add('h_status', 'Status', '状态');
  add('optional', 'optional', '可不填');
  add('demo', 'Demo mode: not connected to Trello. The data is fictional and resets on refresh.', '演示模式：未连接 Trello，数据为虚构示例，刷新即还原。');
  add('add_stage', '+ Add stage', '+ 添加阶段');
  add('contract', 'Contract total (for cross-check)', '合同总额（用于核对）');
  add('no_access', 'Fee details are visible to board members with edit access only.', '收费明细仅对有编辑权限的看板成员显示。');

  // overview
  add('err_read', 'Could not read board data: {0}', '读取看板数据失败：{0}');
  add('open_card', 'Open card', '打开卡片');
  add('t_over', 'Overdue', '逾期未付');
  add('t_over_sub', 'Past the due date', '已过付款到期日');
  add('t_inv', 'Invoiced, unpaid', '已开票待付款');
  add('t_inv_sub', 'Not yet due', '未到期');
  add('t_done', 'Done, to invoice', '已完成待开票');
  add('t_done_sub', 'Time to bill', '该发账单了');
  add('t_bal', 'Contract balance', '合同剩余未收');
  add('t_bal_sub', 'Incl. stages not started', '含未到阶段');
  add('t_recv', 'Total received', '已收款合计');
  add('t_recv_sub', '{0} matters with a schedule', '{0} 个案件有收费表');
  add('t_recv_sub_1', '1 matter with a schedule', '1 个案件有收费表');
  add('none_todo', 'Nothing to invoice or chase right now.', '目前没有需要开票或催款的阶段。');
  add('c_matter', 'Matter (card)', '案件（卡片）');
  add('c_list', 'List', '列表');
  add('c_stage', 'Stage', '阶段');
  add('c_amount', 'Outstanding', '未收金额');
  add('c_status', 'Status', '状态');
  add('c_inv', 'Invoice no.', '发票号');
  add('c_timing', 'Timing', '时间');
  add('of_amount', 'of {0}', '共 {0}');
  add('unnamed', '(unnamed stage)', '（未命名阶段）');
  add('none_all', 'No card on this board has a fee schedule yet. Open a card, then use the "Fee schedule" Power-Up button to create one.', '这个看板上还没有卡片建立收费表。打开卡片，用 Power-Up 的「收费表」按钮新建。');
  add('c_total', 'Contract total', '合同总额');
  add('c_received', 'Received', '已收');
  add('c_now', 'Receivable now', '应收未收');
  add('c_notdue', 'Not yet due', '未到阶段');
  add('c_prog', 'Progress', '进度');
  add('mismatch_short', 'Stages ≠ contract total', '阶段合计 ≠ 合同总额');
  add('demo_short', 'Demo mode: fictional data.', '演示模式：虚构数据。');
  add('h_todo', 'Needs follow-up', '需要跟进');
  add('h_todo_sub', '{0} stages · overdue → to invoice → not yet due', '{0} 个阶段 · 逾期 → 待开票 → 未到期');
  add('h_todo_sub_1', '1 stage', '1 个阶段');
  add('h_all', 'All matters', '全部案件');
  add('h_all_sub', 'sorted by amount receivable now', '按应收未收金额排序');
  add('footnote', 'Figures come from each card\'s fee schedule (as at {0}; archived cards excluded). Amounts are entered by hand and are not accounting or trust records.', '数据来自各卡片的收费表（统计日期 {0}，不含已归档卡片）。金额为手工录入，不是会计/信托账记录。');
  add('export', 'Export CSV', '导出 CSV');
  add('export_hint', 'Copy this text and paste it into a spreadsheet, or save it as a .csv file.', '复制下面的文字粘贴到表格软件，或另存为 .csv 文件。');
  add('copy', 'Copy', '复制');
  add('copied', 'Copied', '已复制');
  add('close', 'Close', '关闭');
  add('csv_head', 'Card,List,Stage,Amount,Received,Outstanding,Status,Invoice no.,Due date,Date paid,Date done,Date invoiced', '卡片,列表,阶段,金额,已收,未收,状态,发票号,到期日,收款日,完成日,开票日');

  // settings
  add('s_lang', 'Language', '界面语言');
  add('s_lang_auto', 'Automatic (follow Trello / browser)', '自动（跟随 Trello / 浏览器）');
  add('s_cur', 'Currency symbol', '货币符号');
  add('s_terms', 'Default payment terms (days from invoice to due date)', '默认付款期限（开票后多少天到期）');
  add('s_days', ' days', ' 天');
  add('s_tpls', 'Stage templates (one per line: Stage name | amount; use 0 to fill in later)', '阶段模板（每行：阶段名称 | 金额，金额可写 0 以后再填）');
  add('ph_tpl_name', 'Template name', '模板名称');
  add('ph_tpl_lines', 'One stage per line: Stage name | amount\ne.g. Work delivered | 2200', '每行一个阶段：阶段名称 | 金额\n例：递交申请 | 2200');
  add('del_tpl', 'Delete template', '删除模板');
  add('new_tpl', '+ New template', '+ 新模板');
  add('save_settings', 'Save settings', '保存设置');
  add('e_noname', 'Template {0} has no name', '第 {0} 个模板没有名称');
  add('e_badline', '"{0}": line {1} is not valid', '「{0}」第 {1} 行格式不对');
  add('e_tplname', 'Template {0}', '模板 {0}');
  add('e_size', 'The settings exceed Trello\'s board storage limit (about 4,000 characters). Please trim the templates.', '设置内容超出 Trello 看板存储上限（约 4000 字符），请删减模板。');
  add('about', 'Matter Fee Manager {0} · Fee data is stored only in your Trello board.', 'Matter Fee Manager {0} · 收费数据只保存在你的 Trello 看板里。');
  add('privacy', 'Privacy', '隐私政策');
  add('support', 'Help & support', '帮助与支持');

  root.MFM_STR = STR;
  if (typeof module !== 'undefined' && module.exports) module.exports = STR;
})(typeof window !== 'undefined' ? window : globalThis);
