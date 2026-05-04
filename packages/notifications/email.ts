// packages/notifications/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Elorge SPM <noreply@elorge.com>'

export async function sendRemappingRequestEmail(to: string, details: {
  officerName: string
  clientCount: number
  requestedBy: string
  orgName: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Action Required: Remapping Request — ${details.officerName}`,
    html: `
      <h2>Remapping Request Pending Your Approval</h2>
      <p>A remapping request has been submitted by <strong>${details.requestedBy}</strong> 
         at <strong>${details.orgName}</strong>.</p>
      <ul>
        <li>Exiting Officer: ${details.officerName}</li>
        <li>Clients to Remap: ${details.clientCount}</li>
      </ul>
      <p>Please log into <a href="${process.env.NEXTAUTH_URL}/settings/remapping">Elorge SPM</a> 
         to review and approve or reject this request.</p>
    `,
  })
}

export async function sendRemappingApprovedEmail(to: string, details: {
  officerName: string
  servicingOfficerName: string
  remapType: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Remapping Request Approved',
    html: `
      <h2>Remapping Request Approved</h2>
      <p>The remapping request for <strong>${details.officerName}'s</strong> client portfolio 
         has been approved.</p>
      <p>Remapping type: <strong>${details.remapType}</strong></p>
      ${details.servicingOfficerName
        ? `<p>Servicing officer assigned: <strong>${details.servicingOfficerName}</strong></p>`
        : '<p>Portfolio frozen — no commission on future transactions.</p>'
      }
    `,
  })
}
