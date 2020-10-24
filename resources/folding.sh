#!/bin/bash -xe
sudo yum -y update
wget https://download.foldingathome.org/releases/public/release/fahclient/centos-6.7-64bit/v7.6/fahclient-7.6.13-1.x86_64.rpm
sudo rpm -i --nodeps fahclient-7.6.13-1.x86_64.rpm
wget https://download.foldingathome.org/releases/public/release/fahcontrol/centos-6.7-64bit/v7.6/fahcontrol-7.6.13-1.noarch.rpm
sudo rpm -i --nodeps fahcontrol-7.6.13-1.noarch.rpm
wget https://download.foldingathome.org/releases/public/release/fahviewer/centos-6.7-64bit/v7.6/fahviewer-7.6.13-1.x86_64.rpm
sudo rpm -i --nodeps fahviewer-7.6.13-1.x86_64.rpm

# Cloud Watch Log
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -i --nodeps amazon-cloudwatch-agent.rpm
cat << EOF > /home/ec2-user/cloudwatch_config.json
{
    "agent": {
    "run_as_user": "root"
    },
    "logs": {
            "logs_collected": {
            "files": {
                "collect_list": [
                {
                    "file_path": "/var/lib/fahclient/log.txt",
                    "log_group_name": "fahlog",
                    "log_stream_name": "{instance_id}"
                }
                ]
            }
            }
    }
}
EOF

sudo cp /home/ec2-user/cloudwatch_config.json /opt/aws/amazon-cloudwatch-agent/bin/config.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s
# If the gpu v=true it enables the GPU to be utilized
cat << EOF > /home/ec2-user/fah_config.xml
<config>
    <gpu v="true"/>
    <power v="full"/>
    # User information section, please modify accordingly
    <!-- User Information -->
    <team v="Default"/>
    <user v="0"/> 
    <passkey v="PASSKEY_HERE"/>
</config>
EOF
sudo /etc/init.d/FAHClient stop
sudo cp /home/ec2-user/fah_config.xml /etc/fahclient/config.xml
sudo /etc/init.d/FAHClient start