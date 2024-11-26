const Campaign = require("../models/campaign");

const createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json({ message: "Campaign created!", campaign });
  } catch (error) {
    res.status(500).json({ message: "Error creating campaign", error });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.status(200).json(campaigns);
  } catch (error) {
    res.status(500).json({ message: "Error fetching campaigns", error });
  }
};

module.exports = { createCampaign, getCampaigns };
