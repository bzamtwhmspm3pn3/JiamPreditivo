// fix-duplicate-final.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixDuplicateFinal() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');
    
    const db = mongoose.connection.db;
    const COLLECTION_NAME = 'profiles'; // ← NOME CORRETO (inglês)
    
    // 1. VERIFICAR SE A COLEÇÃO EXISTE
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      console.log(`❌ Coleção "${COLLECTION_NAME}" não encontrada!`);
      console.log('📋 Coleções disponíveis:');
      collections.forEach(c => console.log(`   - ${c.name}`));
      return;
    }
    
    // 2. VERIFICAR ÍNDICES
    console.log('\n📊 VERIFICANDO ÍNDICES...');
    const indexes = await db.collection(COLLECTION_NAME).indexes();
    console.log('Índices encontrados:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}:`, JSON.stringify(idx.key));
    });
    
    // 3. REMOVER ÍNDICE PROBLEMÁTICO
    const hasIndex = indexes.some(idx => idx.name === 'identificacao_1');
    if (hasIndex) {
      console.log('\n⚠️ Índice "identificacao_1" encontrado. Removendo...');
      await db.collection(COLLECTION_NAME).dropIndex('identificacao_1');
      console.log('✅ Índice removido com sucesso!');
    } else {
      console.log('\n✅ Índice "identificacao_1" não existe.');
    }
    
    // 4. VERIFICAR REGISTROS DUPLICADOS
    console.log('\n🔍 VERIFICANDO REGISTROS DUPLICADOS...');
    const duplicates = await db.collection(COLLECTION_NAME).aggregate([
      { $match: { identificacao: { $exists: true, $ne: null } } },
      { $group: { 
        _id: "$identificacao", 
        ids: { $push: "$_id" },
        count: { $sum: 1 } 
      }},
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`⚠️ Encontradas ${duplicates.length} identificações duplicadas:`);
      
      for (const dup of duplicates) {
        console.log(`\n📌 Identificação: ${dup._id}`);
        console.log(`   IDs: ${dup.ids.map(id => id.toString()).join(', ')}`);
        
        // Manter o primeiro documento, remover os outros
        const [keep, ...remove] = dup.ids;
        console.log(`   🟢 Manter: ${keep}`);
        console.log(`   🔴 Remover: ${remove.map(id => id.toString()).join(', ')}`);
        
        for (const id of remove) {
          await db.collection(COLLECTION_NAME).deleteOne({ _id: id });
          console.log(`      ✅ Removido documento ${id}`);
        }
      }
      console.log('\n✅ Duplicatas removidas!');
    } else {
      console.log('✅ Nenhum registro duplicado encontrado.');
    }
    
    // 5. VERIFICAR O PERFIL DO USUÁRIO ATUAL
    console.log('\n🔍 VERIFICANDO PERFIL DO USUÁRIO...');
    const userProfile = await db.collection(COLLECTION_NAME).findOne({
      user: new mongoose.Types.ObjectId('6947ffc5a4b4dd8efe6c95e4')
    });
    
    if (userProfile) {
      console.log('✅ Perfil encontrado:');
      console.log(`   - _id: ${userProfile._id}`);
      console.log(`   - nome: ${userProfile.nome}`);
      console.log(`   - identificacao: ${userProfile.identificacao}`);
      console.log(`   - telefone: ${userProfile.telefone}`);
    } else {
      console.log('❌ Perfil não encontrado para o usuário');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado do MongoDB');
  }
}

fixDuplicateFinal();