const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSSO() {
  try {
    console.log('🌱 Seeding SSO integrations...')

    const ssoIntegrations = [
      {
        name: 'GOOGLE',
        displayName: 'Google Workspace SSO',
        clientId: '123456789-abcdef.apps.googleusercontent.com',
        clientSecret: 'GOCSPX-abcdefghijklmnopqrstuvwxyz',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: JSON.stringify(['openid', 'email', 'profile']),
        isActive: true
      },
      {
        name: 'MICROSOFT',
        displayName: 'Microsoft Azure AD',
        clientId: '98765432-1234-5678-9abc-def123456789',
        clientSecret: 'abcdefghijklmnopqrstuvwxyz123456',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scopes: JSON.stringify(['openid', 'email', 'profile', 'User.Read']),
        isActive: true
      },
      {
        name: 'GITHUB',
        displayName: 'GitHub Enterprise',
        clientId: 'github-client-id-12345',
        clientSecret: 'github-client-secret-abcdef',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: JSON.stringify(['read:user', 'user:email']),
        isActive: false
      },
      {
        name: 'LDAP',
        displayName: 'LDAP Authentication',
        clientId: 'ldap-server-1',
        clientSecret: 'ldap-secret-key',
        authUrl: 'ldap://ldap.example.com:389',
        tokenUrl: 'ldap://ldap.example.com:389',
        userInfoUrl: null,
        scopes: JSON.stringify(['read']),
        isActive: false
      }
    ]

    for (const integrationData of ssoIntegrations) {
      const integration = await prisma.oAuthProvider.create({
        data: integrationData
      })
      console.log(`✅ Created SSO integration: ${integration.displayName}`)
    }

    console.log('✅ SSO integrations seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding SSO integrations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSSO() 