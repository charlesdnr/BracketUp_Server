const express = require('express');
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');
const { validateTeam, validateUUID } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

const validateAddMember = [
  body('userId').isUUID().withMessage('Valid user ID required')
];

const validateTransferCaptaincy = [
  body('newCaptainId').isUUID().withMessage('Valid new captain ID required')
];

router.get('/', teamController.getAllTeams);

router.get('/:id', validateUUID, teamController.getTeamById);

router.post('/', validateTeam, authenticateToken, teamController.createTeam);

router.put('/:id', validateUUID, validateTeam, authenticateToken, teamController.updateTeam);

router.delete('/:id', validateUUID, authenticateToken, teamController.deleteTeam);

router.post('/:id/members', validateUUID, validateAddMember, authenticateToken, teamController.addMember);

router.delete('/:id/members/:userId', validateUUID, authenticateToken, teamController.removeMember);

router.patch('/:id/captain', validateUUID, validateTransferCaptaincy, authenticateToken, teamController.transferCaptaincy);

module.exports = router;