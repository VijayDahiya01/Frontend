import './style.css';
import { API_URL, WS_URL } from './components/config.js';

console.log('Customer Care Dashboard');
console.log('API URL:', API_URL);
console.log('WebSocket URL:', WS_URL);

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (app) {
    console.log('Dashboard initialized');
  }
});
