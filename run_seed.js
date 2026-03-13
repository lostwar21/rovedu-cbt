const { execSync } = require('child_process');
const fs = require('fs');

try {
    const result = execSync('npx tsx prisma/seed.ts');
    console.log(result.toString());
} catch (e) {
    const stdout = e.stdout ? e.stdout.toString() : '';
    const stderr = e.stderr ? e.stderr.toString() : '';
    const report = `Message: ${e.message}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    fs.writeFileSync('err.txt', report, 'utf8');
}
