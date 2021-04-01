export const htmlTemplate = ({
	cssPath = 'index.css',
	jsPath = 'index.bundle.js',
}: {
	cssPath?: string;
	jsPath?: string;
} = {}) =>
	`<html>
		<head>
			<link cow rel="stylesheet" href="./${cssPath}" />
		</head>
		<body style="margin: 50px;">
			<div style="font-family: din-2014, 'Helvetica Neue', sans-serif">Text</div>
			<div style="font-family: din-2014, 'Helvetica Neue', sans-serif; font-weight: 600;">Text-Bold</div>
			<div style="margin-top: 300px;" id="root"></div>
			<script src="./${jsPath}"></script>
		</body>
	</html>`;
