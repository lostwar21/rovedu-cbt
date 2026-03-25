const fs = require('fs');
const file = 'src/components/guru/bank-soal/EditorSoalLanjutan.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace Button
const oldBtn = `<button 
                    onClick={() => { resetForm(); setMode("ADD_ESSAY"); }}`;
const newBtn = `<button 
                  onClick={() => setShowImportModal(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white rounded-md transition-all font-medium text-sm shadow-sm"
                >
                  <FileText className="w-4 h-4" /> Import Excel
                </button>
                <button 
                    onClick={() => { resetForm(); setMode("ADD_ESSAY"); }}`;
data = data.replace(oldBtn, newBtn);

// Replace Bottom Component
const bottomStr = `                    </div>
                 ))
             )}
        </div>

    </div>
  );
}`;
const newBottomStr = `                    </div>
                 ))
             )}
        </div>

        {/* Modal Import Excel */}
        {showImportModal && (
          <ImportSoalModal bankSoalId={bankSoal.id} onClose={() => setShowImportModal(false)} />
        )}

    </div>
  );
}`;
data = data.replace(bottomStr, newBottomStr);

fs.writeFileSync(file, data);
console.log("Injected Successfully!");
