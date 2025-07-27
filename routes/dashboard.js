const express = require('express');
const router = express.Router();
const axios = require('axios');
const passport = require('passport');
const User = require('../models/User'); // adjust the path if needed
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const History = require('../models/History');
const mailer = require('../utils/mailer');
const cronHelper = require('../utils/cronHelper');
const Schedule = require('../models/Schedule');
const Template = require('../models/Template');
const UserTemplate = require('../models/UserTemplate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


require('dotenv').config(); // Load env variables

// ✅ TEMPORARY DIRECT API KEY FOR TESTING
const OPENROUTER_API_KEY =process.env.OPENROUTER_API_KEY; // ⬅️ replace with your actual OpenRouter key

// 🛡️ Middleware to protect dashboard routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/login');
}

// ✅ Dashboard Main Page
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// ✅ Compose Page (GET)
router.get('/compose', ensureAuthenticated, (req, res) => {
  res.render('compose', { output: '', user: req.user });
});

// ✅ Compose Page (POST for generating cold message)
router.post('/compose', ensureAuthenticated, async (req, res) => {
  const { role,roleOther,industry,industryOther, tone,toneOther, receiver,receiverOther, language,languageOther, platform,platformOther, type,typeOther, extra } = req.body;
   const finalIndustry = industry === "Other" ? industryOther : industry;
   const finalRole = role === "Other" ? roleOther : role;
   const finalTone = tone === "Other" ? toneOther : tone;
   const finalPlatform = platform === "Other" ? platformOther : platform;
   const finalType = type === "Other" ? typeOther : type;
   const finalLanguage = language === "Other" ? languageOther : language;
   const finalReceiver = receiver === "Other" ? receiverOther : receiver;

  const prompt = `As I am a  ${finalRole} in the ${finalIndustry} ,and I want to  write a ${finalTone.toLowerCase()} ${finalType.toLowerCase()} cold message in ${finalLanguage} for the ${finalPlatform} platform to the ${finalReceiver}. Extra context: ${extra || 'None'}.`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo-0613',
        messages: [
          { role: 'system', content: 'You are a professional cold message generator.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`, // ✅ Using hardcoded key here
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'EmailGenie'
        },
        timeout: 30000
      }
    );

    const output = response.data.choices[0].message.content.trim();
    const historyEntry = new History({
      userId: req.user._id,
      type: 'compose',
      platform,
      category: type,
      language,
      tone,
      message: output
    });

    await historyEntry.save();
    res.render('compose', { output, ...req.body, user: req.user });

  } catch (error) {
    console.error('❌ OpenRouter Error:', error.message);
    const fallback = error.response?.data?.error?.message || 'Message generation failed. Try again.';
    res.render('compose', { output: fallback, ...req.body, user: req.user });
  }
});
router.post('/schedule-from-compose', ensureAuthenticated, (req, res) => {
  const message = encodeURIComponent(req.body.output);
  res.redirect(`/dashboard/schedule?prefill=${message}`);
});

// routes/dashboard.js
router.get('/templates', ensureAuthenticated, async (req, res) => {
  const templates = await Template.find({ user: req.user._id });

  const prebuiltTemplates = [
   {
    _id: 'pre1',
    title: 'Cold Outreach- Networking',
    content: "Hi [Name],\n\nI came across your profile and was impressed by your work in [industry/domain]. I'm currently exploring opportunities to connect with professionals in this space and would love to learn more about your journey. Would you be open to a quick call or chat sometime this week?\n\nBest regards,\n[Your Name]"
  },

  {
    _id: 'pre2',
    title: 'Job Seeking - Cold Outreach to Hiring Manager',
    content: "Hi [Hiring Manager's Name],\n\nI hope you're doing well. I recently came across the [Job Title] role at [Company Name] and was excited by how well it aligns with my background in [Your Skills/Field].\n\nI’d love to bring my experience in [relevant work] to your team. I’ve attached my resume and would be thrilled to connect or chat if you're open to it.\n\nWarm regards,\n[Your Name]"
  },
  {
    _id: 'pre3',
    title: 'Partnership Inquiry',
    content: "Hi [Name],\n\nI'm reaching out to explore potential partnership opportunities between [Your Company] and [Their Company]. I believe there's strong synergy in our missions and a collaboration could be mutually beneficial.\n\nWould you be available for a quick call to discuss possibilities?\n\nBest,\n[Your Name]"
  },
  {
    _id: 'pre4',
    title: 'Follow-Up After No Response',
    content: "Hi [Name],\n\nJust wanted to follow up on my previous message. I understand things get busy, but I'd still love the chance to connect and see if there's a fit between our goals.\n\nIf now isn't a good time, I'm happy to follow up later—just let me know what works best.\n\nThanks again,\n[Your Name]"
  },
  {
    _id: 'pre5',
    title: 'Startup Founder to Investor',
    content: "Hi [Investor Name],\n\nI'm the founder of [Startup Name], and we're building [one-liner pitch]. We're currently raising our seed round and I thought of you given your interest in [industry/type of companies].\n\nI'd love to send over our deck or schedule a brief intro call if you're open to learning more.\n\nBest regards,\n[Your Name]"
  },
  {
    _id: 'pre6',
    title: 'Freelancer Pitching Services',
    content: "Hi [Client Name],\n\nI'm a [Your Role] with experience in [Your Specialization]. I recently came across your [website/project/profile] and thought my skills might be valuable to your work.\n\nIf you're in need of help with [specific task], I'd be glad to offer a free consultation.\n\nLooking forward to connecting,\n[Your Name]"
  },
  {
    _id: 'pre7',
    title: 'Conference Networking - Post-Event',
    content: "Hi [Name],\n\nIt was great meeting you at [Conference Name]! I enjoyed our conversation around [topic] and thought it'd be great to stay in touch.\n\nIf you're open to continuing the conversation, maybe we can grab a virtual coffee soon?\n\nCheers,\n[Your Name]"
  },
  {
    _id: 'pre8',
    title: 'Influencer Collaboration',
    content: "Hi [Influencer's Name],\n\nI'm [Your Name], working with [Brand Name], and we're big fans of your content around [topic/niche].\n\nWe're exploring partnerships with creators like you for an upcoming campaign. If you're open to it, we'd love to discuss how we might work together.\n\nLet me know your thoughts!\n\nBest,\n[Your Name]"
  },
  {
    _id: 'pre9',
    title: 'Cold Email to Recruiter',
    content: "Hi [Recruiter's Name],\n\nHope you're doing well. I'm reaching out because I'm actively exploring roles in [specific field], and I admire the companies and positions you work with.\n\nI'd love to send over my resume and see if there's a potential match. Do let me know if that sounds okay!\n\nRegards,\n[Your Name]"
  },
  {
    _id: 'pre10',
    title: 'Outreach to Past Client',
    content: "Hi [Client Name],\n\nHope everything is going great on your end! Just checking in to see how [project name] has been progressing since we last worked together.\n\nIf there's anything you need or if there's an opportunity to collaborate again, I'd love to reconnect.\n\nBest,\n[Your Name]"
  },
  {
    _id: 'pre11',
    title: 'Connecting with Alumni',
    content: "Hi [Alumni Name],\n\nI'm a fellow [School Name] alum, currently pursuing a career in [field]. I came across your profile and was inspired by your journey.\n\nIf you're open to it, I'd love to connect and get your insights into [industry/role].\n\nThanks so much,\n[Your Name]"
  },
  {
    _id: 'pre12',
    title: 'Intro to New Tool/Product',
    content: "Hi [Name],\n\nWe just launched [Product Name], a tool designed to help [target audience] solve [pain point].\n\nI'd love to get your feedback or offer a free trial to see how it might help your team.\n\nWould you be interested in learning more?\n\nThanks,\n[Your Name]"
  },
  {
    _id: 'pre13',
    title: 'Re-Engagement with Old Lead',
    content: "Hi [Name],\n\nIt's been a while since we last connected, and I wanted to check in to see if your needs around [topic] have changed.\n\nWe've made some great improvements to [Product/Service], and I think it might be worth revisiting.\n\nLet me know if you'd like a quick update.\n\nBest,\n[Your Name]"
  },
  {
    _id: 'pre14',
    title: 'Cold DM on LinkedIn',
    content: "Hi [Name],\n\nI saw your recent post on [topic] and found it really insightful. I'd love to connect and follow your work.\n\nI'm currently working on [brief description], and I think there may be mutual value in staying in touch.\n\nCheers,\n[Your Name]"
  },
  {
    _id: 'pre15',
    title: 'Referral Request - Internal Contact',
    content: "Hi [First Name],\n\nI hope you're doing well! I noticed that you're currently working at [Company Name], and I was wondering if you'd be willing to refer me for the [Job Title] position listed on the careers page.\n\nI've attached my resume and would be happy to provide any other info you need. Your support would mean a lot!\n\nThanks again,\n[Your Name]"
  }
  ];

  res.render('templates', { user: req.user, prebuiltTemplates, templates });
});


// GET create new template form
router.get('/templates/new', ensureAuthenticated, (req, res) => {
  const { title, content } = req.query;
  res.render('create-template', { user: req.user ,prefill: {
      title: title || '',
      content: content || '',
    }, });
});

// POST create new template
router.post('/templates/create', ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  const template = await Template.create({ user: req.user._id, title, content });

  // Record history
  await History.create({
    userId: req.user._id,
    type:'template',
    title,
    content,
    action: 'created',
    isPrebuilt: false
  });

  res.redirect('/dashboard/templates'); // Redirecting to My Templates
});

// GET edit template
router.get('/templates/edit/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;

  // Prebuilt template logic
  const prebuiltTemplates = {
    pre1: {
    _id: 'pre1',
    title: 'Cold Outreach- Networking',
    content: "Hi [Name],\n\nI came across your profile and was impressed by your work in [industry/domain]. I'm currently exploring opportunities to connect with professionals in this space and would love to learn more about your journey. Would you be open to a quick call or chat sometime this week?\n\nBest regards,\n[Your Name]"
  },

  pre2: {
    _id: 'pre2',
    title: 'Job Seeking - Cold Outreach to Hiring Manager',
    content: "Hi [Hiring Manager's Name],\n\nI hope you're doing well. I recently came across the [Job Title] role at [Company Name] and was excited by how well it aligns with my background in [Your Skills/Field].\n\nI’d love to bring my experience in [relevant work] to your team. I’ve attached my resume and would be thrilled to connect or chat if you're open to it.\n\nWarm regards,\n[Your Name]"
  },
  pre3: {
    _id: 'pre3',
    title: 'Partnership Inquiry',
    content: "Hi [Name],\n\nI'm reaching out to explore potential partnership opportunities between [Your Company] and [Their Company]. I believe there's strong synergy in our missions and a collaboration could be mutually beneficial.\n\nWould you be available for a quick call to discuss possibilities?\n\nBest,\n[Your Name]"
  },
  pre4:{
    _id: 'pre4',
    title: 'Follow-Up After No Response',
    content: "Hi [Name],\n\nJust wanted to follow up on my previous message. I understand things get busy, but I'd still love the chance to connect and see if there's a fit between our goals.\n\nIf now isn't a good time, I'm happy to follow up later—just let me know what works best.\n\nThanks again,\n[Your Name]"
  },
  pre5:{
    _id: 'pre5',
    title: 'Startup Founder to Investor',
    content: "Hi [Investor Name],\n\nI'm the founder of [Startup Name], and we're building [one-liner pitch]. We're currently raising our seed round and I thought of you given your interest in [industry/type of companies].\n\nI'd love to send over our deck or schedule a brief intro call if you're open to learning more.\n\nBest regards,\n[Your Name]"
  },
  pre6:{
    _id: 'pre6',
    title: 'Freelancer Pitching Services',
    content: "Hi [Client Name],\n\nI'm a [Your Role] with experience in [Your Specialization]. I recently came across your [website/project/profile] and thought my skills might be valuable to your work.\n\nIf you're in need of help with [specific task], I'd be glad to offer a free consultation.\n\nLooking forward to connecting,\n[Your Name]"
  },
  pre7:{
    _id: 'pre7',
    title: 'Conference Networking - Post-Event',
    content: "Hi [Name],\n\nIt was great meeting you at [Conference Name]! I enjoyed our conversation around [topic] and thought it'd be great to stay in touch.\n\nIf you're open to continuing the conversation, maybe we can grab a virtual coffee soon?\n\nCheers,\n[Your Name]"
  },
  pre8:{
    _id: 'pre8',
    title: 'Influencer Collaboration',
    content: "Hi [Influencer's Name],\n\nI'm [Your Name], working with [Brand Name], and we're big fans of your content around [topic/niche].\n\nWe're exploring partnerships with creators like you for an upcoming campaign. If you're open to it, we'd love to discuss how we might work together.\n\nLet me know your thoughts!\n\nBest,\n[Your Name]"
  },
  pre9:{
    _id: 'pre9',
    title: 'Cold Email to Recruiter',
    content: "Hi [Recruiter's Name],\n\nHope you're doing well. I'm reaching out because I'm actively exploring roles in [specific field], and I admire the companies and positions you work with.\n\nI'd love to send over my resume and see if there's a potential match. Do let me know if that sounds okay!\n\nRegards,\n[Your Name]"
  },
  pre10:{
    _id: 'pre10',
    title: 'Outreach to Past Client',
    content: "Hi [Client Name],\n\nHope everything is going great on your end! Just checking in to see how [project name] has been progressing since we last worked together.\n\nIf there's anything you need or if there's an opportunity to collaborate again, I'd love to reconnect.\n\nBest,\n[Your Name]"
  },
  pre11:{
    _id: 'pre11',
    title: 'Connecting with Alumni',
    content: "Hi [Alumni Name],\n\nI'm a fellow [School Name] alum, currently pursuing a career in [field]. I came across your profile and was inspired by your journey.\n\nIf you're open to it, I'd love to connect and get your insights into [industry/role].\n\nThanks so much,\n[Your Name]"
  },
  pre12:{
    _id: 'pre12',
    title: 'Intro to New Tool/Product',
    content: "Hi [Name],\n\nWe just launched [Product Name], a tool designed to help [target audience] solve [pain point].\n\nI'd love to get your feedback or offer a free trial to see how it might help your team.\n\nWould you be interested in learning more?\n\nThanks,\n[Your Name]"
  },
  pre13:{
    _id: 'pre13',
    title: 'Re-Engagement with Old Lead',
    content: "Hi [Name],\n\nIt's been a while since we last connected, and I wanted to check in to see if your needs around [topic] have changed.\n\nWe've made some great improvements to [Product/Service], and I think it might be worth revisiting.\n\nLet me know if you'd like a quick update.\n\nBest,\n[Your Name]"
  },
  pre14:{
    _id: 'pre14',
    title: 'Cold DM on LinkedIn',
    content: "Hi [Name],\n\nI saw your recent post on [topic] and found it really insightful. I'd love to connect and follow your work.\n\nI'm currently working on [brief description], and I think there may be mutual value in staying in touch.\n\nCheers,\n[Your Name]"
  },
  pre15:{
    _id: 'pre15',
    title: 'Referral Request - Internal Contact',
    content: "Hi [First Name],\n\nI hope you're doing well! I noticed that you're currently working at [Company Name], and I was wondering if you'd be willing to refer me for the [Job Title] position listed on the careers page.\n\nI've attached my resume and would be happy to provide any other info you need. Your support would mean a lot!\n\nThanks again,\n[Your Name]"
  }
  };
  if (prebuiltTemplates[id]) {
    return res.render('edit-template', {
      user: req.user,
      template: prebuiltTemplates[id],
      isPrebuilt: true,
    });
  }

  // User-created template
  const template = await Template.findOne({ _id: id, user: req.user._id });
  if (!template) return res.redirect('/dashboard/templates');

  res.render('edit-template', { user: req.user, template, isPrebuilt: false });
});
// POST update template
router.post('/templates/update/:id', ensureAuthenticated, async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;

  // If it's a prebuilt template, save as custom template
  if (id.startsWith('pre')) {
    await Template.create({
      user: req.user._id,
      title,
      content,
    });

    await History.create({
      userId: req.user._id,
      type: 'template',
      title,
      content,
      action: 'customized from prebuilt',
      isPrebuilt: true,
    });

    return res.redirect('/dashboard/templates');
  }

  // Else update normal template
  const updated = await Template.updateOne(
    { _id: id, user: req.user._id },
    { title, content }
  );

  if (updated.modifiedCount > 0) {
    await History.create({
      userId: req.user._id,
      type: 'template',
      title,
      content,
      action: 'updated',
      isPrebuilt: false,
    });
  }

  res.redirect('/dashboard/templates');
});
// DELETE route to delete a user-created template
router.delete('/templates/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, user: req.user._id });
    if (!template) {
      return res.status(403).json({ error: "Unauthorized or template not found" });
    }
    // Record delete history before deletion
    await History.create({
      userId: req.user._id,
      type:'template',
      title: template.title,
      content: template.content,
      action: 'deleted',
      isPrebuilt:false
    });

    await Template.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


function getPlatformDMLink(platform) {
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return 'https://www.linkedin.com/messaging/';
    case 'twitter':
      return 'https://twitter.com/messages';
    case 'instagram':
      return 'https://www.instagram.com/direct/inbox/';
    case 'gmail':
      return 'https://mail.google.com/mail/u/0/#inbox';
    default:
      return '#';
  }
}

router.get('/schedule', ensureAuthenticated, (req, res) => {
  const tokens = req.user.googleTokens || {};
  res.render('schedule', {
    user: req.user,
    prefill: req.query.prefill || '',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY
  });
});

router.post('/subscribe', ensureAuthenticated, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    pushSubscription: req.body.subscription
  });
  res.sendStatus(201);
});
router.post('/schedule', ensureAuthenticated, async (req, res) => {
  const { platform, type, message, date, time, timezone } = req.body;

  const notifyEmail = !!req.body.notifyEmail;
  const notifyBrowser = !!req.body.notifyBrowser;

  const datetime = `${date}T${time}`;
  
  try {
    const s = await Schedule.create({
      user: req.user.id,
      platform,
      type,
      message,
      date,
      time,
      timezone,
      notifyEmail,
      notifyBrowser,
    });

    const scheduleUrl = `${process.env.BASE_URL}/dashboard/schedule/${s._id}`;

    // Schedule cron job
    cronHelper.scheduleJob(datetime, async () => {
      if (notifyEmail) {
        await mailer.sendReminder(req.user.email, message, scheduleUrl);
      }
});

    // Save to History
    const history = new History({
      userId: req.user._id,
      type: 'schedule',
      platform,
      language: req.body.language || '',
      tone: req.body.tone || '',
      message,
      scheduleId: s._id,
    });

    await history.save();

    // Redirect AFTER everything is done
    res.redirect('/dashboard/history');
  } catch (err) {
    console.error("Schedule error:", err);
    res.status(500).send("Error saving schedule");
  }
});


// GET /dashboard/schedule/:id
// GET /dashboard/schedule/:id => Show scheduled message with buttons
router.get('/schedule/:id', ensureAuthenticated, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).send("Scheduled message not found");

    res.render('schedule-details', {
      user: req.user,
      schedule,
      getPlatformDMLink // ✅ Pass this function to EJS
    });
  } catch (err) {
    console.error("Error loading scheduled message:", err);
    res.status(500).send("Error loading schedule");
  }
});
// Update schedule message after editing
router.post("/update-schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    await Schedule.findByIdAndUpdate(id, { message });
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});
router.get('/schedule/edit/:id', ensureAuthenticated, async (req, res) => {
  const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!schedule) return res.status(404).send("Schedule not found");

  res.render('edit-schedule', { schedule });
});
router.post('/schedule/edit/:id', ensureAuthenticated, async (req, res) => {
  const { platform, type, message, date, time, timezone, notifyEmail, notifyBrowser } = req.body;
  const schedule = await Schedule.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    {
      platform,
      type,
      message,
      date,
      time,
      timezone,
      notifyEmail: !!notifyEmail,
      notifyBrowser: !!notifyBrowser
    },
    { new: true }
  );

  if (!schedule) return res.status(404).send("Not found");
  res.redirect('/dashboard/history');
});
router.get('/schedule/cancel/:id', ensureAuthenticated, async (req, res) => {
  const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!schedule) return res.status(404).send("Schedule not found");

  // Optional: Also update related History entry
  await History.updateOne({ scheduleId: req.params.id }, { $set: { message: "[CANCELLED] " + schedule.message } });

  res.redirect('/dashboard/history');
});

// GET history by tab
router.get('/history', async (req, res) => {
  const allHistory = await History.find({ userId: req.user._id })
  
  .populate('scheduleId')
  .sort({ createdAt: -1 })
  .lean();

  res.render('history', {
    user: req.user,
    allHistory
  });
});
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
  
    const upcomingMessages = await Schedule.find({ user: req.user.id }).sort({ date: 1, time: 1 }).limit(3);

    res.render('profile', {
      user,
      upcomingMessages
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});
router.get('/change-password', ensureAuthenticated, (req, res) => {
  const user = req.user;
  
  if (user.googleId && !user.emailPassword) {
    // Google only login — redirect to Google Account settings
    return res.redirect('https://myaccount.google.com/security');
  }

  // Otherwise, show change password form
  res.render('change-password', { user, message: null });
});
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.render('change-password', { user, message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.render('change-password', { user, message: 'New passwords do not match' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.render('change-password', { user, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Log the user out and redirect to login with success query
    req.logout(() => {
      res.redirect('/auth/login?success=1');
    });

  } catch (err) {
    console.error(err);
    res.render('change-password', { user, message: 'Something went wrong' });
  }
});
router.delete('/delete-account', async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userId = req.user._id;
    console.log('Deleting user:', userId);

    await User.findByIdAndDelete(userId);

    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed.' });
      }

      req.session.destroy();
      res.clearCookie('connect.sid');

      return res.status(200).json({ message: 'Account deleted successfully.' });
    });

  } catch (err) {
    console.error('Error deleting account:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${req.user._id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

router.post('/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const profilePicPath = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profilePicture: profilePicPath });
    res.redirect('/dashboard/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading profile picture");
  }
});
module.exports = router;
