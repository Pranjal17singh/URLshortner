const express = require('express');
const { Analytics, URL, Submission } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.post('/track', async (req, res) => {
  try {
    const { urlId, eventType, metadata = {} } = req.body;

    if (!urlId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await Analytics.create({
      urlId,
      eventType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      metadata
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Failed to track analytics' });
  }
});

router.get('/overall', authenticate, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeRange) {
      case '1d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '7d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '30d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '90d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    const userUrls = await URL.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    const urlIds = userUrls.map(url => url.id);

    if (urlIds.length === 0) {
      return res.json({
        totalClicks: 0,
        totalLeads: 0,
        activeUrls: 0,
        conversionRate: 0
      });
    }

    const [activeUrls, totalClicks, totalLeads] = await Promise.all([
      URL.count({ 
        where: { 
          userId: req.user.id, 
          isActive: true 
        } 
      }),
      
      Analytics.count({
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          ...dateFilter
        }
      }),
      
      Analytics.count({
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'form_submit',
          ...dateFilter
        }
      })
    ]);

    const conversionRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : 0;

    res.json({
      totalClicks,
      totalLeads,
      activeUrls,
      conversionRate: parseFloat(conversionRate)
    });

  } catch (error) {
    console.error('Overall analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch overall analytics' });
  }
});

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '24h':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '7d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '30d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '90d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    const userUrls = await URL.findAll({
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    const urlIds = userUrls.map(url => url.id);

    if (urlIds.length === 0) {
      return res.json({
        totalUrls: 0,
        totalClicks: 0,
        totalLeads: 0,
        conversionRate: 0,
        clicksByDay: [],
        leadsByDay: [],
        topUrls: [],
        countries: [],
        devices: [],
        browsers: []
      });
    }

    const [
      totalUrls,
      clicksData,
      leadsData,
      topUrlsData,
      countryData,
      deviceData,
      browserData,
      timeSeriesData
    ] = await Promise.all([
      URL.count({ where: { userId: req.user.id } }),
      
      Analytics.count({
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          ...dateFilter
        }
      }),
      
      Analytics.count({
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'form_submit',
          ...dateFilter
        }
      }),
      
      // Get top URLs with counts using subquery approach
      Analytics.findAll({
        attributes: [
          'urlId',
          [require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'count']
        ],
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          ...dateFilter
        },
        group: ['urlId'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'DESC']],
        limit: 10,
        raw: true
      }).then(async (topUrlsData) => {
        // Get URL details separately to avoid GROUP BY issues
        const topUrlIds = topUrlsData.map(item => item.urlId);
        const urlDetails = await URL.findAll({
          where: { id: { [Op.in]: topUrlIds } },
          attributes: ['id', 'originalUrl', 'shortCode', 'customAlias', 'title'],
          raw: true
        });
        
        // Combine the data
        return topUrlsData.map(analytics => {
          const url = urlDetails.find(u => u.id === analytics.urlId);
          return { ...analytics, url };
        });
      }),
      
      Analytics.findAll({
        attributes: [
          'country',
          [require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'count']
        ],
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          country: { [Op.ne]: null },
          ...dateFilter
        },
        group: ['country'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'DESC']],
        limit: 10
      }),
      
      Analytics.findAll({
        attributes: [
          'device',
          [require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'count']
        ],
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          device: { [Op.ne]: null },
          ...dateFilter
        },
        group: ['device'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'DESC']],
        limit: 10
      }),
      
      Analytics.findAll({
        attributes: [
          'browser',
          [require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'count']
        ],
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: 'click',
          browser: { [Op.ne]: null },
          ...dateFilter
        },
        group: ['browser'],
        order: [[require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'DESC']],
        limit: 10
      }),
      
      Analytics.findAll({
        attributes: [
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
          'eventType',
          [require('sequelize').fn('COUNT', require('sequelize').col('Analytics.id')), 'count']
        ],
        where: {
          urlId: { [Op.in]: urlIds },
          eventType: { [Op.in]: ['click', 'form_submit'] },
          ...dateFilter
        },
        group: [
          require('sequelize').fn('DATE', require('sequelize').col('createdAt')),
          'eventType'
        ],
        order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
      })
    ]);

    const conversionRate = clicksData > 0 ? ((leadsData / clicksData) * 100).toFixed(2) : 0;
    
    const clicksByDay = {};
    const leadsByDay = {};
    
    timeSeriesData.forEach(item => {
      const date = item.getDataValue('date');
      const eventType = item.eventType;
      const count = parseInt(item.getDataValue('count'));
      
      if (eventType === 'click') {
        clicksByDay[date] = count;
      } else if (eventType === 'form_submit') {
        leadsByDay[date] = count;
      }
    });

    res.json({
      totalUrls,
      totalClicks: clicksData,
      totalLeads: leadsData,
      conversionRate: parseFloat(conversionRate),
      clicksByDay,
      leadsByDay,
      topUrls: topUrlsData.map(item => ({
        url: item.url,
        clicks: parseInt(item.getDataValue('count'))
      })),
      countries: countryData.map(item => ({
        country: item.country,
        count: parseInt(item.getDataValue('count'))
      })),
      devices: deviceData.map(item => ({
        device: item.device,
        count: parseInt(item.getDataValue('count'))
      })),
      browsers: browserData.map(item => ({
        browser: item.browser,
        count: parseInt(item.getDataValue('count'))
      }))
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

router.get('/url/:urlId', authenticate, async (req, res) => {
  try {
    const { urlId } = req.params;
    const { timeframe = '30d' } = req.query;

    const url = await URL.findOne({
      where: { id: urlId, userId: req.user.id }
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '24h':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '7d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '30d':
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    const [analytics, submissions] = await Promise.all([
      Analytics.findAll({
        where: {
          urlId,
          ...dateFilter
        },
        order: [['createdAt', 'DESC']],
        limit: 100
      }),
      
      Submission.findAll({
        where: {
          urlId,
          ...dateFilter
        },
        order: [['createdAt', 'DESC']],
        limit: 50
      })
    ]);

    const eventCounts = analytics.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    const timeSeriesData = analytics.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { clicks: 0, form_views: 0, form_submits: 0, redirects: 0 };
      }
      acc[date][event.eventType] = (acc[date][event.eventType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      url: {
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        customAlias: url.customAlias,
        title: url.title,
        clicks: url.clicks,
        leads: url.leads,
        conversionRate: url.clicks > 0 ? ((url.leads / url.clicks) * 100).toFixed(2) : 0
      },
      eventCounts,
      timeSeriesData,
      recentActivity: analytics.slice(0, 20),
      submissions: submissions.map(sub => ({
        id: sub.id,
        data: sub.submissionData,
        createdAt: sub.createdAt,
        ipAddress: sub.ipAddress,
        country: sub.country
      }))
    });

  } catch (error) {
    console.error('URL analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch URL analytics' });
  }
});

router.get('/export/:urlId', authenticate, async (req, res) => {
  try {
    const { urlId } = req.params;
    const { format = 'json' } = req.query;

    const url = await URL.findOne({
      where: { id: urlId, userId: req.user.id }
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const submissions = await Submission.findAll({
      where: { urlId },
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      const csv = require('csv-stringify');
      
      if (submissions.length === 0) {
        return res.status(404).json({ error: 'No submissions found' });
      }

      const headers = Object.keys(submissions[0].submissionData);
      const rows = submissions.map(sub => 
        headers.map(header => sub.submissionData[header] || '')
      );

      csv([headers, ...rows], (err, output) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to generate CSV' });
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="submissions-${url.shortCode}.csv"`);
        res.send(output);
      });
    } else {
      res.json({
        url: {
          originalUrl: url.originalUrl,
          shortCode: url.shortCode,
          customAlias: url.customAlias,
          title: url.title
        },
        submissions: submissions.map(sub => ({
          data: sub.submissionData,
          createdAt: sub.createdAt,
          ipAddress: sub.ipAddress,
          country: sub.country
        }))
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;