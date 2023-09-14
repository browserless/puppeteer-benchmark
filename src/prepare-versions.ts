import path from "path";
import { exec } from "child_process";

export const prepareVersions = async (versions: string[]) => {
	const installPromises = versions.map((version) => {
		return new Promise<void>((resolve, reject) => {
			exec(
				`npm i puppeteer-${version}@npm:puppeteer@${version} --no-save --prefix ./versions/puppeteer-${version}`,
				{
					cwd: path.resolve(__dirname, ".."),
				},
				(err) => {
					if (err) {
						return reject(err);
					}

					resolve();
				},
			);
		});
	});

	await Promise.all(installPromises);
};
