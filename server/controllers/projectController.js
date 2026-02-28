const Project = require("../models/Project");
const Task = require("../models/Task");

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Project name is required" });

    const exists = await Project.findOne({ name: name.trim(), user: req.user._id });
    if (exists) return res.status(400).json({ message: "Project already exists" });

    const project = await Project.create({ name: name.trim(), color: color || "#1d4ed8", user: req.user._id });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { name, color } = req.body;
    if (name) project.name = name.trim();
    if (color) project.color = color;
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Move tasks under this project to "General"
    await Task.updateMany(
      { project: project.name, user: req.user._id },
      { project: "General" }
    );

    await project.deleteOne();
    res.json({ message: "Project deleted", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
