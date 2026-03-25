const fs = require('fs');
const file = 'src/components/guru/bank-soal/EditorSoalLanjutan.tsx';
let data = fs.readFileSync(file, 'utf8');

const targetStr = `                                <button className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors border border-border/50">
                                    <ImageIcon className="w-3.5 h-3.5"/> Sisipkan Gambar (BETA)
                                </button>`;

const replacementStr = `                                <button type="button" onClick={handleSisipGambar} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors border border-border/50">
                                    <ImageIcon className="w-3.5 h-3.5"/> Sisipkan Gambar (BETA)
                                </button>`;

data = data.replaceAll(targetStr, replacementStr);

fs.writeFileSync(file, data);
console.log('Injected onClick!');
