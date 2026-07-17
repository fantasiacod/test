const fs = require('fs');
const path = './public/pages';

// 1. Process issues-archives.html
let archiveHtml = fs.readFileSync(path + '/issues-archives.html', 'utf8');

// Change Title
archiveHtml = archiveHtml.replace('<title>Technical Issues', '<title>Issue Archives');

// Change Header Text and remove Add Button
archiveHtml = archiveHtml.replace(
    /<h2><span data-i18n="lbl_technical_issues">Technical Issues<\/span><\/h2><nav class="breadcrumb"><a href="\/dashboard">Home<\/a> \/ <span>Technical Issues<\/span><\/nav><\/div>\s*<button class="btn btn-primary-custom" onclick="TechnicalIssues.openCreateModal\(\)"><i class="fas fa-plus me-2"><\/i><span data-i18n="btn_report_issue">Report Issue<\/span><\/button><\/div>/g,
    '<h2><span data-i18n="lbl_issue_archives">Issue Archives</span></h2><nav class="breadcrumb"><a href="/dashboard">Home</a> / <span>Issue Archives</span></nav></div></div>'
);

// Remove Tabs
archiveHtml = archiveHtml.replace(/<ul class="nav nav-tabs mb-4" id="issueTabs">[\s\S]*?<\/ul>/, '');

// Change JS file
archiveHtml = archiveHtml.replace('<script src="/js/technicalIssues.js"></script>', '<script src="/js/issuesArchives.js"></script>');

// Make Issue Archives active in sidebar instead of Technical Issues
archiveHtml = archiveHtml.replace('<a href="/technical-issues" class="nav-link active">', '<a href="/technical-issues" class="nav-link">');
archiveHtml = archiveHtml.replace('<a href="/issues-archives" class="nav-link">', '<a href="/issues-archives" class="nav-link active">');

fs.writeFileSync(path + '/issues-archives.html', archiveHtml);


// 2. Process technical-issues.html
let techHtml = fs.readFileSync(path + '/technical-issues.html', 'utf8');

// Remove Tabs
techHtml = techHtml.replace(/<ul class="nav nav-tabs mb-4" id="issueTabs">[\s\S]*?<\/ul>/, '');

fs.writeFileSync(path + '/technical-issues.html', techHtml);

console.log('HTML files prepared.');
