// Soul Forge Starter - Main Entry Point
// Build Your Soul. Build Your Empire.

const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════╗
║     🌌 SOUL FORGE STARTER v1.0                           ║
║     Build Your Soul. Build Your Empire.                  ║
╚══════════════════════════════════════════════════════════╝
`);

// Check if soul file exists
const soulPath = path.join(__dirname, 'my-soul.json');

let soul = {
  name: 'Soul Seeker',
  createdAt: Date.now(),
  level: 1,
  title: 'Seed',
  profit: 0,
  love: 0,
  tax: 0,
  grace: 0,
  deeds: [],
  checkIns: []
};

// Load existing soul
if (fs.existsSync(soulPath)) {
  soul = JSON.parse(fs.readFileSync(soulPath, 'utf-8'));
  console.log(`\n✨ Welcome back, ${soul.name}!`);
  console.log(`   Level ${soul.level} - ${soul.title}`);
} else {
  console.log('\n🌱 New soul detected. Let\'s begin your journey...');
  console.log('   Your soul file will be created at: my-soul.json');
}

// Main menu
function showMenu() {
  console.log(`
  ─────────────────────────────────────────────────────
  📊 SOUL STATUS
  ─────────────────────────────────────────────────────
  💰 Profit: ${soul.profit}/100
  ❤️  Love:   ${soul.love}/100
  📊 Tax:    ${soul.tax}/100
  ✨ Grace:  ${soul.grace}/100
  ─────────────────────────────────────────────────────
  Overall: ${soul.profit + soul.love + soul.tax + soul.grace}/400
  `);

  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║  WHAT WILL YOU DO?                                   ║
  ╠══════════════════════════════════════════════════════╣
  ║  1. 📝 Record a Deed                                 ║
  ║  2. 🧘 Daily Check-in                                ║
  ║  3. 📖 View Deed History                             ║
  ║  4. 🦋 Check Evolution                               ║
  ║  5. 💾 Export Soul                                   ║
  ║  6. 🌐 Open Dashboard                                ║
  ║  7. ❌ Exit                                          ║
  ╚══════════════════════════════════════════════════════╝
  `);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('  Choose (1-7): ', (answer) => {
    handleChoice(answer);
    readline.close();
  });
}

function handleChoice(choice) {
  switch(choice) {
    case '1':
      recordDeed();
      break;
    case '2':
      checkIn();
      break;
    case '3':
      viewHistory();
      break;
    case '4':
      checkEvolution();
      break;
    case '5':
      exportSoul();
      break;
    case '6':
      openDashboard();
      break;
    case '7':
      console.log('\n🙏 Your soul journey continues. Build well.\n');
      process.exit(0);
    default:
      console.log('\n❌ Invalid choice. Try again.\n');
      showMenu();
  }
}

function recordDeed() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n📝 RECORD A DEED\n');

  readline.question('  What did you do? ', (action) => {
    console.log('\n  Category:');
    console.log('  1. 💰 Profit');
    console.log('  2. ❤️  Love');
    console.log('  3. 📊 Tax');
    console.log('  4. ✨ Grace');

    readline.question('  Choose (1-4): ', (catChoice) => {
      const categories = ['profit', 'love', 'tax', 'grace'];
      const category = categories[parseInt(catChoice) - 1] || 'grace';

      readline.question('  Describe it: ', (description) => {
        readline.question('  Value (1-10): ', (valueStr) => {
          const value = Math.min(10, Math.max(1, parseInt(valueStr) || 1));

          const deed = {
            id: Date.now(),
            action,
            category,
            description,
            value,
            timestamp: Date.now()
          };

          soul.deeds.push(deed);
          soul[category] = Math.min(100, soul[category] + value);

          // Level up
          const total = soul.profit + soul.love + soul.tax + soul.grace;
          soul.level = Math.floor(total / 10) + 1;
          soul.title = getTitleForLevel(soul.level);

          saveSoul();

          console.log(`\n✅ Deed recorded! +${value} ${category}`);
          console.log(`   You are now Level ${soul.level} - ${soul.title}\n`);

          readline.close();
          showMenu();
        });
      });
    });
  });
}

function checkIn() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🧘 DAILY CHECK-IN\n');

  readline.question('  How is your soul today? ', (reflection) => {
    readline.question('  What\'s your intention for today? ', (intention) => {
      const checkIn = {
        id: Date.now(),
        reflection,
        intention,
        timestamp: Date.now(),
        plt: { profit: soul.profit, love: soul.love, tax: soul.tax, grace: soul.grace }
      };

      soul.checkIns.push(checkIn);
      saveSoul();

      console.log('\n✅ Check-in recorded!\n');
      readline.close();
      showMenu();
    });
  });
}

function viewHistory() {
  console.log('\n📖 DEED HISTORY\n');

  if (soul.deeds.length === 0) {
    console.log('  No deeds recorded yet. Start building!\n');
  } else {
    soul.deeds.slice(-10).reverse().forEach((deed, i) => {
      const icons = { profit: '💰', love: '❤️', tax: '📊', grace: '✨' };
      const date = new Date(deed.timestamp).toLocaleDateString();
      console.log(`  ${i + 1}. ${icons[deed.category]} ${deed.action}`);
      console.log(`     ${deed.description}`);
      console.log(`     ${date} | +${deed.value} ${deed.category}\n`);
    });
  }

  showMenu();
}

function checkEvolution() {
  const stages = [
    'Seed', 'Sprout', 'Sapling', 'Grower', 'Gardener',
    'Weaver', 'Builder', 'Creator', 'Architect', 'Cosmic',
    'Ancient', 'Eternal', 'Infinite', 'Multiversal', 'Divine'
  ];

  const currentIndex = Math.min(soul.level - 1, stages.length - 1);
  const currentStage = stages[currentIndex];
  const nextStage = stages[currentIndex + 1];
  const progress = (soul.level % 10) * 10;

  console.log('\n🦋 SOUL EVOLUTION\n');
  console.log(`  Current Stage: ${currentStage}`);
  console.log(`  Next Stage: ${nextStage || 'MAX LEVEL REACHED!'}\n`);
  console.log(`  Progress: ${progress}%\n`);

  if (nextStage) {
    console.log(`  ${10 - (soul.level % 10)} more levels to ${nextStage}!\n`);
  } else {
    console.log('  🏆 You have reached the highest stage: Divine!\n');
  }

  showMenu();
}

function exportSoul() {
  const exportPath = path.join(__dirname, `soul-export-${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(soul, null, 2));
  console.log(`\n✅ Soul exported to: ${exportPath}\n`);
  showMenu();
}

function openDashboard() {
  const dashboardPath = path.join(__dirname, 'soul-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    const { exec } = require('child_process');
    const openCommand = process.platform === 'darwin' ? 'open' :
                        process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${openCommand} "${dashboardPath}"`);
    console.log('\n🌐 Opening dashboard...\n');
  } else {
    console.log('\n❌ Dashboard not found. Please ensure soul-dashboard.html exists.\n');
  }
  showMenu();
}

function saveSoul() {
  fs.writeFileSync(soulPath, JSON.stringify(soul, null, 2));
}

function getTitleForLevel(level) {
  const titles = [
    'Seed', 'Sprout', 'Sapling', 'Grower', 'Gardener',
    'Weaver', 'Builder', 'Creator', 'Architect', 'Cosmic',
    'Ancient', 'Eternal', 'Infinite', 'Multiversal', 'Divine'
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Soul';
}

// Start
showMenu();
