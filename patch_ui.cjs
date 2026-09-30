const fs = require('fs');

const content = fs.readFileSync('src/pages/AdminRawMaterials.jsx', 'utf8');
const chunk = fs.readFileSync('chunk_tab4.txt', 'utf8');

const target = `      {/* TAB 4: UNCHANGED - Weekly Planning UI was removed in earlier phase, keeping placeholder for now */}
      {activeTab === 'weekly' && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <strong>Tab Rencana Mingguan belum memiliki UI.</strong> UI asli perlu dikembalikan dari file backup.
          </p>
        </div>
      )}`;

const newChunk = '      {/* TAB 4: Rencana Mingguan (Migrated to React Query) */}\n' + chunk;

if (content.includes(target)) {
    fs.writeFileSync('src/pages/AdminRawMaterials.jsx', content.replace(target, newChunk));
    console.log('SUCCESS');
} else {
    console.log('TARGET NOT FOUND');
}
