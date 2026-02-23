// fix-profile-final.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixProfileFinal() {
  try {
    console.log('🔍 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');
    
    const db = mongoose.connection.db;
    const COLLECTION_NAME = 'profiles';
    
    // 1. IDs dos perfis
    const PERFIL_VAZIO_ID = '6999c0985b15b70af2a34246';
    const PERFIL_CORRETO_ID = '6947fa50a876a53d5daf7d3b';
    const USER_ID = '6947ffc5a4b4dd8efe6c95e4';
    
    // 2. VERIFICAR PERFIL CORRETO
    console.log('\n🔍 VERIFICANDO PERFIL CORRETO...');
    const perfilCorreto = await db.collection(COLLECTION_NAME).findOne({
      _id: new mongoose.Types.ObjectId(PERFIL_CORRETO_ID)
    });
    
    if (perfilCorreto) {
      console.log('✅ Perfil correto encontrado:');
      console.log(`   - _id: ${perfilCorreto._id}`);
      console.log(`   - nome: ${perfilCorreto.nome}`);
      console.log(`   - identificacao: ${perfilCorreto.identificacao}`);
      console.log(`   - telefone: ${perfilCorreto.telefone}`);
    } else {
      console.log('❌ Perfil correto NÃO encontrado!');
    }
    
    // 3. APAGAR PERFIL VAZIO
    console.log('\n🗑️ APAGANDO PERFIL VAZIO...');
    const deleteResult = await db.collection(COLLECTION_NAME).deleteOne({
      _id: new mongoose.Types.ObjectId(PERFIL_VAZIO_ID)
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log('✅ Perfil vazio removido com sucesso!');
    } else {
      console.log('⚠️ Perfil vazio não encontrado ou já removido');
    }
    
    // 4. ATUALIZAR PERFIL CORRETO COM USER_ID
    console.log('\n📝 ATUALIZANDO PERFIL CORRETO...');
    const updateResult = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new mongoose.Types.ObjectId(PERFIL_CORRETO_ID) },
      { 
        $set: { 
          user: new mongoose.Types.ObjectId(USER_ID),
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ Perfil correto atualizado com user ID!');
    } else {
      console.log('⚠️ Perfil correto já estava atualizado');
    }
    
    // 5. VERIFICAR RESULTADO FINAL
    console.log('\n🔍 VERIFICANDO RESULTADO FINAL...');
    const perfilFinal = await db.collection(COLLECTION_NAME).findOne({
      user: new mongoose.Types.ObjectId(USER_ID)
    });
    
    if (perfilFinal) {
      console.log('✅ PERFIL FINAL OK:');
      console.log(`   - _id: ${perfilFinal._id}`);
      console.log(`   - nome: ${perfilFinal.nome}`);
      console.log(`   - identificacao: ${perfilFinal.identificacao}`);
      console.log(`   - telefone: ${perfilFinal.telefone}`);
      console.log(`   - user: ${perfilFinal.user}`);
    } else {
      console.log('❌ Nenhum perfil encontrado para o usuário');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado do MongoDB');
  }
}

fixProfileFinal();