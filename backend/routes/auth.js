const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");

// REGISTRO
router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("nome").notEmpty().trim()
], async (req,res)=>{
  try{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({success:false, errors: errors.array()});

    const { email, password, nome } = req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({success:false,message:"Email já cadastrado"});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const user = await User.create({
      username: email.split("@")[0],
      email,
      password: hashedPassword,
      status: "active",
      email_confirmado: true // agora sempre confirmado
    });

    const token = jwt.sign({ id:user._id, role:user.role }, process.env.JWT_SECRET || "jiam_secret",{expiresIn:"7d"});

    res.status(201).json({success:true,message:"Cadastro realizado com sucesso", token, user:{id:user._id, email:user.email, username:user.username, role:user.role}});
  }catch(err){
    console.error(err);
    res.status(500).json({success:false,message:"Erro no servidor"});
  }
});

// LOGIN
router.post("/login", [
  body("username").notEmpty(),
  body("password").notEmpty()
], async (req,res)=>{
  try{
    const {username,password} = req.body;
    const user = await User.findOne({$or:[{email:username},{username}]});
    if(!user) return res.status(401).json({success:false,message:"Credenciais inválidas"});

    const isPasswordValid = await bcrypt.compare(password,user.password);
    if(!isPasswordValid) return res.status(401).json({success:false,message:"Credenciais inválidas"});

    user.lastLogin = new Date(); await user.save();

    const token = jwt.sign({id:user._id, role:user.role}, process.env.JWT_SECRET || "jiam_secret",{expiresIn:"7d"});

    res.status(200).json({success:true,message:"Login realizado",token,user:{id:user._id,email:user.email,username:user.username,role:user.role,email_confirmado:true}});
  }catch(err){
    console.error(err);
    res.status(500).json({success:false,message:"Erro no servidor"});
  }
});

module.exports = router;
